module.exports = function (router) {
    router.get('/xboxgamepass/:platform?/:locale?/:country?', require('./index'));
};
