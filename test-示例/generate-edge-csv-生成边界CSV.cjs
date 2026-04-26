#!/usr/bin/env node
// 生成边界测试CSV：超长文本、多行单元格、大量行数、中文、emoji、空值等
const fs = require('fs');
const path = require('path');

const rows = [];

// 表头
rows.push('id,name,age,email,salary,description,multi_line,emoji,very_long_text,chinese,empty_col,mixed');

// 1. 多行单元格（3行换行）
rows.push(`1,张三,25,zhang@example.com,50000.00,普通员工,"第一行\n第二行\n第三行",😀🎉,${'a'.repeat(500)},北京,,,abc123!@#`);

// 2. 单行但超长文本
rows.push(`2,李四,30,li@example.com,68000.50,高级工程师,只有一行,🚀🔥,${'b'.repeat(1000)},上海,,,@#$%中文mix`);

// 3. 空值行
rows.push(`3,,0,,,,,,${'c'.repeat(50)},,,,,`);

// 4. 多行单元格（5行换行）
rows.push(`4,王五,35,wang@example.com,92000.00,"含逗号,含引号""内嵌""","line1\nline2\nline3\nline4\nline5",💡✨,${'d'.repeat(2000)},广州,,123中文abc`);

// 5. 超大数字
rows.push(`5,赵六,999999,zhao@example.com,999999999.99,数字测试,单行,🎯,${'e'.repeat(300)},深圳,,0`);

// 6. 日期格式
rows.push(`6,孙七,28,sun@example.com,72000.00,2024-01-15入职,"日期行1\n日期行2",📅,${'f'.repeat(100)},成都,,2024-12-31`);

// 7. 特殊字符
rows.push(`8,"O""Brien",33,o@example.com,55000.00,"含""引号"",逗号","特殊\n字符",🎲,${'g'.repeat(800)},杭州,,<script>alert(1)</script>`);

// 8. 纯emoji行
rows.push(`9,😀人,1,emoji@test.com,100.00,emoji测试,🎮🎹🎻,🎊🎈,${'h'.repeat(50)},重庆,,🎮123`);

// 9. 超长多行
const longMultiLine = Array.from({length: 20}, (_, i) => `第${i+1}行：${'x'.repeat(100)}`).join('\n');
rows.push(`10,超长多行,40,long@test.com,120000.00,超长多行测试,"${longMultiLine}",🧪,${'i'.repeat(5000)},武汉,,long`);

// 10. Tab和特殊空白
rows.push(`11,空白测试,27,space@test.com,45000.00,"含\t制表符",普通行,🫠,${'j'.repeat(100)},南京,,\t\t`);

// 11-210. 批量行（200行普通数据）
for (let i = 11; i <= 210; i++) {
  const names = ['张','李','王','赵','孙','周','吴','郑','冯','陈'];
  const cities = ['北京','上海','广州','深圳','成都','杭州','武汉','南京','重庆','西安'];
  const emojis = ['😀','😎','🤔','😅','🥳','😤','🤩','😴','🤮','🫠'];
  const name = names[i % 10] + '某' + (i % 100);
  const age = 20 + (i % 40);
  const salary = (30000 + i * 100).toFixed(2);
  const city = cities[i % 10];
  const emoji = emojis[i % 10];
  const desc = i % 5 === 0 ? `"多行\n第${i}行"` : `普通行${i}`;
  const longText = i % 10 === 0 ? 'x'.repeat(200 + i) : `short${i}`;
  const emptyCol = i % 7 === 0 ? '' : `val${i}`;
  const mixed = i % 3 === 0 ? `${emoji}${i}abc` : `${i}`;
  rows.push(`${i+1},${name},${age},user${i}@test.com,${salary},${desc},${emoji},${longText},${city},,${emptyCol},${mixed}`);
}

// 211-510. 再加300行让总数超500
for (let i = 211; i <= 510; i++) {
  const age = 20 + (i % 45);
  const salary = (25000 + i * 50).toFixed(2);
  const desc = i % 20 === 0 ? `"超长行\n${'z'.repeat(300)}"` : `row${i}`;
  rows.push(`${i+1},批量${i},${age},batch${i}@test.com,${salary},${desc},📌,${i % 30 === 0 ? 'L'.repeat(500) : `t${i}`},批量城市,,${i % 11 === 0 ? '' : i},mix${i}`);
}

const output = rows.join('\n');
const outPath = path.join(__dirname, 'edge-cases-边界测试.csv');
fs.writeFileSync(outPath, output, 'utf8');
console.log(`生成完毕: ${outPath}`);
console.log(`总行数: ${rows.length} (含表头)`);
console.log(`文件大小: ${(Buffer.byteLength(output) / 1024).toFixed(1)} KB`);
