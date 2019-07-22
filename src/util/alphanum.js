/**
 * Compare two strings in alphanumerical order
 * Example: '1-test' < '2-test' < '10-foo' < '10-test' < '20-test1' < '20-test2' < '20-test222'
 */
const alphanumericComparator = (a, b) => {
    let [tokenA, tokenB] = [a, b].map((str) => str.match(/\d+|./g));
    while (tokenA.length && tokenB.length) {
        let [curA, curB] = [tokenA, tokenB]
            .map(k => k.shift()).map(k => isNaN(Number(k)) ? k : Number(k));
        if (curA < curB) return -1;
        if (curA > curB) return 1;
    }
    return tokenA.length - tokenB.length;
}

module.exports = alphanumericComparator;