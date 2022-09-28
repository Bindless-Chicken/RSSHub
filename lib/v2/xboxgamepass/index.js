const got = require('@/utils/got');
const { parseDate } = require('@/utils/parse-date');
const { art } = require('@/utils/render');
const path = require('path');
const dayjs = require('dayjs');

module.exports = async (ctx) => {
    const locale = ctx.params.locale ?? 'en-US';
    const country = ctx.params.country ?? 'US';
    const platform = ctx.params.platform ?? 'console';

    const platform_id = (platform === 'pc') ? 'fdd9e2a7-0fee-49f6-ad69-4354098401ff' : 'f6f1f99f-9b49-4ccd-b3bf-4d9767a77f5e';

    const catalogUrl = `https://catalog.gamepass.com/sigls/v2?id=${platform_id}&language=${locale}&market=${country}`;

    const response = await got({
        method: 'get',
        url: catalogUrl,
    });

    const catalogItems = response.data
    .filter(
        (item) =>
            item.id
    )
    .map(item => item.id)
    .join(',')

    const detailsUrl = `https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=${catalogItems}&languages=${locale}&market=${country}&MS-CV=DGU1mcuYo0WMMp`;

    const detailsProductsResponse = await got({
        method: 'get',
        url: detailsUrl,
    });

    const items = detailsProductsResponse.data.Products
        .map(async (item) => {
            let image = item.LocalizedProperties[0].Images[0].Uri;
            item.LocalizedProperties[0].Images.some((keyImage) => {
                if (keyImage.ImagePurpose === 'BoxArt') {
                    image = keyImage.Uri;
                    return true;
                }
                return false;
            });

            const developer = item.LocalizedProperties[0].DeveloperName
            const publisher = item.LocalizedProperties[0].PublisherName
            const type = item.Properties.Category
            const description = item.LocalizedProperties[0].ProductDescription

            const storeLink = `https://www.xbox.com/${locale}/games/store/game/${item.ProductId}`

            return {
                guid: item.ProductId,
                title: item.LocalizedProperties[0].ProductTitle,
                author: item.LocalizedProperties[0].DeveloperName,
                link: storeLink,
                description: art(path.join(__dirname, 'templates/description.art'), {
                    image,
                    developer,
                    publisher,
                    type,
                    description,
                }),
                pubDate: parseDate(dayjs()),
            };
        });
    ctx.state.data = {
        title: 'XBoxGamePass',
        link: catalogUrl,
        item: await Promise.all(items),
    };
};
