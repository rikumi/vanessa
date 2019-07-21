<template>
    <div class='cert-intro'>
        <div class='title'>Vanessa Proxy</div>
        <a href="/api/cert" target="_blank"><div class='download'>Download Certificate</div></a>
        <div class='trust'>
            <div class='intro'>How to trust:</div>
            <div class='steps android' v-if='/Android/i.test(ua)'>
                Android: 
                <ol>
                    <li>Download the certificate and install it using your password or fingerprint.</li>
                    <li>Give the certificate a name (e.g. Vanessa)</li>
                    <li>In <b>Credential use</b>, select <b>VPN and apps</b>.</li>
                </ol>
            </div>
            <div class='steps ios' v-else-if='/iOS|iPhone|iPad|iPod/i.test(ua)'>
                iOS: 
                <ol>
                    <li>Download the certificate via Safari and allow it to be installed as a description file.</li>
                    <li>You may have to go to <b>Settings</b> - <b>General</b> - <b>Description files</b> - <b>VanessaProxyCA</b>, tap <b>Install</b> and type your password.</li>
                    <li>Navigate to <b>Settings</b> - <b>General</b> - <b>About</b> - <b>Certificate Trust Settings</b>.</li>
                    <li>Turn on <b>Enable Full Trust For Root Certificates</b> for <b>VanessaProxyCA</b>.</li>
                </ol>
            </div>
            <div class='steps android' v-else-if='/Firefox/i.test(ua)'>
                Firefox: 
                <ol>
                    <li>Download and open the certificate in Firefox.</li>
                    <li>Select both the checkboxes and click OK.</li>
                </ol>
            </div>
            <div class='steps macos' v-else-if='/Mac OS X/i.test(ua)'>
                macOS: 
                <ol>
                    <li>Double-click the certificate file and install it to <b>System</b>.</li>
                    <li>You may be prompted for your password multiple times.</li>
                    <li>In <b>Keychain Access.app</b>, select <b>System</b> from <b>Keychains</b> and <b>Certificates</b> from <b>Category</b>.</li>
                    <li>Double-click <b>VanessaProxyCA</b>, change <b>Trust</b> - <b>When using this certificate</b> to <b>Always Trust</b>.</li>
                    <li>Close the window.</li>
                </ol>
            </div>
            <div class='steps linux' v-else-if='/Linux/i.test(ua)'>
                Linux: 
                <ol>
                    <li>You should already know how to import and trust the certificate; or</li>
                    <li>You should already know how to search for the steps.</li>
                </ol>
            </div>
            <div class='steps windows' v-else-if='/Windows/i.test(ua)'>
                Windows: 
                <ol>
                    <li>Change the certificate’s file name extension from .pem to .crt and open the file.</li>
                    <li>Select <b>Install certificate</b> - <b>Local machine</b> and browse the certificate store.</li>
                    <li>Your certificate should be installed into <b>Trusted Root Certification Authorities</b>.</li>
                </ol>
            </div>
            <div class='steps unknown' v-else>
                Your platform is unknown. Please install and trust the downloaded root certificate by yourself.
            </div>
        </div>
        <div class='skip'>I have installed and trusted, <a href="https://vanes.sa/">take me to Vanessa ></a></div>
    </div>
</template>
<script>
export default {
    data: () => ({
        ua: navigator.userAgent
    })
}
</script>
<style lang="less">
a, a:link, a:hover, a:active, a:focus, a:visited {
    color: inherit;
    text-decoration: none;
}

.cert-intro {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
    font-size: 14px;
    color: #333;
    
    .title {
        font-size: 20px;
    }

    .download {
        font-size: 20px;
        background: #adf;
        border-radius: 5px;
        border: 2px solid rgba(0, 0, 0, .1);
        margin: 15px 0;
        padding: 15px 20px;
        color: #045;
    }

    .trust {
        display: flex;
        flex-direction: column;
        margin: 0 35px;
        
        .intro {
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
        }
    }

    .skip {
        font-size: 16px;
        margin: 15px 0;

        a {
            color: #08a;
        }
    }
}
</style>
