const path = require('path');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');
const mkdirp = require('mkdirp');
const { pki, md } = require('node-forge');
const { promisify } = require('util');
const generateKeyPair = promisify(pki.rsa.generateKeyPair);

const CAattrs = [
    {
        name: 'commonName',
        value: 'VanessaProxyCA-' + Date.now()
    },
    {
        name: 'countryName',
        value: 'Internet'
    },
    {
        shortName: 'ST',
        value: 'Internet'
    },
    {
        name: 'localityName',
        value: 'Internet'
    },
    {
        name: 'organizationName',
        value: 'Vanessa Proxy CA'
    },
    {
        shortName: 'OU',
        value: 'CA'
    }
];

const CAextensions = [
    {
        name: 'basicConstraints',
        cA: true
    },
    {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    },
    {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    },
    {
        name: 'nsCertType',
        client: true,
        server: true,
        email: true,
        objsign: true,
        sslCA: true,
        emailCA: true,
        objCA: true
    },
    {
        name: 'subjectKeyIdentifier'
    }
];

const ServerAttrs = [
    {
        name: 'countryName',
        value: 'Internet'
    },
    {
        shortName: 'ST',
        value: 'Internet'
    },
    {
        name: 'localityName',
        value: 'Internet'
    },
    {
        name: 'organizationName',
        value: 'Vanessa Proxy CA'
    },
    {
        shortName: 'OU',
        value: 'Vanessa Proxy Server Certificate'
    }
];

const ServerExtensions = [
    {
        name: 'basicConstraints',
        cA: false
    },
    {
        name: 'keyUsage',
        keyCertSign: false,
        digitalSignature: true,
        nonRepudiation: false,
        keyEncipherment: true,
        dataEncipherment: true
    },
    {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: false,
        emailProtection: false,
        timeStamping: false
    },
    {
        name: 'nsCertType',
        client: true,
        server: true,
        email: false,
        objsign: false,
        sslCA: false,
        emailCA: false,
        objCA: false
    },
    {
        name: 'subjectKeyIdentifier'
    }
];

const randomSerialNumber = () => {
    let sn = '';
    for (let i = 0; i < 4; i++) {
        sn += ('00000000' + Math.floor(Math.random() * Math.pow(256, 4)).toString(16)).slice(-8);
    }
    return sn;
};

const configDir = path.join(os.homedir(), '.vanessa', 'certs');
mkdirp.sync(configDir);

const certFile = path.join(configDir, 'ca-2048.pem');
const privateKeyFile = path.join(configDir, 'ca-2048.key');
const publicKeyFile = path.join(configDir, 'ca-2048.pub');

const certs = {};

let keypair;

const beInitialized = (async () => {
    keypair = await generateKeyPair({ bits: 2048 });

    if (!fs.existsSync(certFile)) {
        let cert = pki.createCertificate();
        cert.publicKey = keypair.publicKey;
        cert.serialNumber = randomSerialNumber();
        cert.validity.notBefore = new Date();
        cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1);
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
        cert.setSubject(CAattrs);
        cert.setIssuer(CAattrs);
        cert.setExtensions(CAextensions);
        cert.sign(keypair.privateKey, md.sha256.create());
        fs.writeFileSync(certFile, pki.certificateToPem(cert));
        fs.writeFileSync(privateKeyFile, pki.privateKeyToPem(keypair.privateKey));
        fs.writeFileSync(publicKeyFile, pki.publicKeyToPem(keypair.publicKey));

        certs.ca = {
            cert,
            key: keypair.privateKey
        };
    } else {
        certs.ca = {
            cert: pki.certificateFromPem(fs.readFileSync(certFile)),
            key: pki.privateKeyFromPem(fs.readFileSync(privateKeyFile))
        };
    }
})();

module.exports = async (host) => {
    await beInitialized;

    if (certs[host]) {
        return certs[host];
    }

    let cert = pki.createCertificate();
    cert.publicKey = keypair.publicKey;
    cert.serialNumber = randomSerialNumber();
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 2);
    let attrs = ServerAttrs.slice(0);

    attrs.unshift({
        name: 'commonName',
        value: host
    });

    cert.setSubject(attrs);
    cert.setIssuer(certs.ca.cert.issuer.attributes);
    cert.setExtensions(
        ServerExtensions.concat([
            {
                name: 'subjectAltName',
                altNames: [host.match(/^[\d\.]+$/) ? { type: 7, ip: host } : { type: 2, value: host }]
            }
        ])
    );
    cert.sign(certs.ca.key, md.sha256.create());
    cert = pki.certificateToPem(cert);
    let key = pki.privateKeyToPem(keypair.privateKey);
    let pub = pki.publicKeyToPem(keypair.publicKey);

    return (certs[host] = { cert, key });
}