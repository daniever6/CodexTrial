离线依赖说明（无需开发环境）

请将以下 3 个文件放到本目录（assets/）后，再双击 index.html 使用：

1) sql-wasm.js
   来源：https://github.com/sql-js/sql.js/releases （或 npm 包 sql.js/dist/sql-wasm.js）

2) sql-wasm.wasm
   来源：https://github.com/sql-js/sql.js/releases （或 npm 包 sql.js/dist/sql-wasm.wasm）

3) xlsx.full.min.js
   来源：https://github.com/SheetJS/sheetjs/releases （或 npm 包 xlsx/dist/xlsx.full.min.js）

最小离线打包步骤：
- 在任意可联网电脑上下载上述 3 个文件。
- 复制到本目录 assets/。
- 保持目录结构：
  - index.html
  - app.js
  - styles.css
  - assets/sql-wasm.js
  - assets/sql-wasm.wasm
  - assets/xlsx.full.min.js
- 双击 index.html 即可离线运行。
