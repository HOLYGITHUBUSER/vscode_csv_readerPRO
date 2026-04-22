# 测试示例 CSV

这些文件用来**肉眼试用**扩展，直接在 VS Code / Cursor 里双击打开即可体验。

- [`complex_test.csv`](complex_test.csv)（32 行 × 12 列）
  - 覆盖各种边界：多语言（中日英德）、嵌套引号 `""Hello""`、单元格内换行、制表符/分号/竖线/反斜杠字符、空值、Unicode。
- [`super_example.csv`](super_example.csv)（1109 行 × 12 列）
  - 前 3 行是 `meta,...` 头部注释，正式表头在第 4 行；用来体验**分块渲染 / 隐藏前 N 行 / 表头自动识别**。

> 自动化测试（`npm test`）使用的是 [`src-源码/test/super_example.csv`](../src-源码/test/super_example.csv) 与 [`src-源码/test/complex_test.csv`](../src-源码/test/complex_test.csv)（严格断言，不建议改动）。
> 本目录里的两个 CSV 是它们的副本，随时可以重新拷贝恢复：
>
> ```bash
> cp src-源码/test/super_example.csv test-示例/super_example.csv
> cp src-源码/test/complex_test.csv   test-示例/complex_test.csv
> ```
>
> 若需要**更大的压力样本**（50000 行 × 60 列；VS Code 打开会很慢甚至报内部 assert），见 [`backup/test-示例-超大样本/`](../backup/test-示例-超大样本/) 或重新运行 `scripts/gen-huge-fixtures.py`。
