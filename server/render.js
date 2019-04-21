const fs = require('fs');const { renderToString } = require('react-dom/server');const path = require('path');const env = process.env.NODE_ENVconst resolve = file => path.resolve(__dirname, file);function templating(template) {    return props => template.replace(/<!--([\s\S]*?)-->/g, (_, key) => props[key.trim()]);}// 删除utf-8文件中的BOM头function stripBOM(content) {    if (content.charCodeAt(0) === 0xFEFF) {        content = content.slice(1);    }    return content;}// require 字符串形式的文件function requireString(src, filename = 'temp') {    const Module = module.constructor;    const m = new Module();    m._compile(stripBOM(src), filename);    return m.exports;}async function render(ctx, serverBundle, template) {    const render = templating(template);    try {        const jsx = await serverBundle(ctx);        const html = renderToString(jsx);        const body = render({            html,            store: `<script>window.__STORE__ = ${JSON.stringify(ctx.store.getState())}</script>`,        });        ctx.body = body;        ctx.type = 'text/html';    }    catch (err) {        ctx.body = err.message;        ctx.type = 'text/html';    }}module.exports = async (app, ctx) => {    let serverBundle;    let template;    if (process.env.NODE_ENV === 'production') {        serverBundle = require('../dist/js/server-bundle').default;        template = fs.readFileSync(resolve('../dist/server.tpl.html'), 'utf-8');    } else {        const { bundle, clientHtml } = await require('../build/dev-server')(app, resolve('../app/index.html'))        serverBundle = requireString(bundle);        template = clientHtml;    }    return await render(ctx, serverBundle, template);}