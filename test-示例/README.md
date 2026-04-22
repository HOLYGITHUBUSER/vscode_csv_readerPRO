# 测试示例 CSV

这些文件用来**肉眼试用**扩展，直接在 VS Code / Cursor 里双击打开即可体验。

- [`complex_test.csv`](complex_test.csv)（32 行 × 12 列）
  - 覆盖各种边界：多语言（中日英德）、嵌套引号 `""Hello""`、单元格内换行、制表符/分号/竖线/反斜杠字符、空值、Unicode。
- [`super_example.csv`](super_example.csv)（1109 行 × 12 列）
  - 前几行是 `meta,...` 头部注释，正式表头在第 4 行；包含布尔/日期/整数/浮点/字符串各种类型，用来体验**分块渲染 / 隐藏前 N 行 / 表头自动识别**。

> 自动化测试（`npm test`）使用的仍是 [`src-源码/test/super_example.csv`](../src-源码/test/super_example.csv) 和 [`src-源码/test/complex_test.csv`](../src-源码/test/complex_test.csv)（本目录为其副本，便于用户查看，改动请以源目录为准）。
