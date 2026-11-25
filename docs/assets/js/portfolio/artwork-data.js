(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.ArtworkData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const imagePrefix = '/media/artworks/';
    const requiredFields = ['name', 'time', 'category', 'material', 'size'];
    const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'webp'];

    function imagePath(value) {
        if (typeof value !== 'string') throw new Error('作品图片路径必须是文字');
        const url = value.startsWith('/') ? value : '/' + value;
        if (!url.startsWith(imagePrefix) || /[\\?#%\u0000-\u001f\u007f]/.test(url)) {
            throw new Error('作品图片必须位于 /media/artworks/，不能使用外部网址或转义路径');
        }
        const segments = url.split('/').slice(1);
        if (segments.some(segment => !segment || segment.startsWith('.') || segment.trim() !== segment)) {
            throw new Error('作品图片路径包含无效目录或文件名');
        }
        const extension = url.split('.').pop().toLowerCase();
        if (!allowedImageExtensions.includes(extension)) throw new Error('作品图片只允许 JPEG、PNG 或 WebP');
        return url;
    }

    function validateArtworks(value) {
        if (!Array.isArray(value)) throw new Error('作品目录必须是数组');
        const seen = new Set();
        return value.map((artwork, index) => {
            if (!artwork || typeof artwork !== 'object' || Array.isArray(artwork)) {
                throw new Error(`第 ${index + 1} 件作品资料无效`);
            }
            for (const field of requiredFields) {
                if (typeof artwork[field] !== 'string' || !artwork[field].trim() || artwork[field].length > 1000) {
                    throw new Error(`第 ${index + 1} 件作品的 ${field} 必须是有效文字`);
                }
            }
            if (!/^\d{4}$/.test(artwork.time)) throw new Error(`作品 ${artwork.name} 的年份必须是四位数字`);
            if (artwork.des !== undefined && (typeof artwork.des !== 'string' || artwork.des.length > 20_000)) {
                throw new Error(`作品 ${artwork.name} 的说明无效`);
            }
            const path = imagePath(artwork.path);
            if (seen.has(path)) throw new Error(`作品主图重复：${path}`);
            seen.add(path);
            if (artwork.detail !== undefined && !Array.isArray(artwork.detail)) {
                throw new Error(`作品 ${artwork.name} 的细节图必须是列表`);
            }
            return {
                ...artwork,
                path,
                des: artwork.des || '',
                ...(artwork.detail !== undefined ? { detail: artwork.detail.map(imagePath) } : {}),
            };
        });
    }

    return { imagePrefix, allowedImageExtensions, imagePath, validateArtworks };
});
