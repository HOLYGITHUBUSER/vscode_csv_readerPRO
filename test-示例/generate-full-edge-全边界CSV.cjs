#!/usr/bin/env node
// 全边界测试CSV - 用JSON配置+运行时构建避免ZWJ解析问题
const fs = require('fs');
const path = require('path');

const rows = [];
const COLS = 30;

// 安全拼接CSV行（避免源码中出现ZWJ字面量）
function row(fields) {
  while (fields.length < COLS) fields.push('');
  return fields.join(',');
}

// 运行时构建ZWJ emoji
function zwj(codePoints) { return String.fromCodePoint(...codePoints); }

// 表头
rows.push(row(['id','name','age','email','salary','description','multi_line','emoji','long_text','chinese','japanese','korean','arabic_rtl','empty_col','whitespace_only','null_like','special_chars','html_xss','url_link','date_variants','number_edge','boolean_like','quoted_comma','quoted_quotes','unbalanced_quote','control_chars','binary_base64','scientific_notation','combining_diacritics','surrogate_pairs']));

// ===== 1. 折行梯度（1-7行）：1/2/3/5/10/20/50行换行 =====
const foldCounts = [1,2,3,5,10,20,50];
foldCounts.forEach((n, i) => {
  const id = i + 1;
  const lines = Array.from({length: n}, (_, j) => 'line' + (j+1)).join('\\n');
  const longLen = [100,200,400,800,1500,3000,5000][i];
  const zwjEmojis = [
    [0x1F600], [0x1F60E], [0x1F389], [0x1F4A1], [0x1F38A], [0x1F9EA], [0x1F52C]
  ];
  rows.push(row([
    String(id), 'fold'+n, String(20+id*3), 't'+id+'@test.com', String(50000+id*5000),
    n+'lines', '"'+lines+'"', zwj(zwjEmojis[i]), 'L'.repeat(longLen),
    ['Beijing','Shanghai','Guangzhou','Shenzhen','Chengdu','Wuhan','Hangzhou'][i],
    ['Tokyo','Osaka','Kyoto','Yokohama','Nagoya','Sapporo','Fukuoka'][i],
    ['Seoul','Busan','Incheon','Daejeon','Gwangju','Daegu','Suwon'][i],
    'Arabic'+i,
    i%2===0?'':' ', i%3===0?'  ':'',
    ['null','NULL','N','NaN','undefined','N/A','nil'][i],
    ['<>&"','|/^','$%&','#@!','~`!',';:','<>{}'][i],
    '<script>alert('+i+')</script>',
    'https://example.com/'+id,
    '2024-0'+(i+1)+'-01',
    [0,-1,999999,'Infinity','-0.001','1e308','NaN'][i].toString(),
    ['false','TRUE','true','FALSE','Yes','no','yes'][i],
    '"comma,inside"','"quote""inside"','unbalanced"quote',
    'plain','U3V2YjY0','1e'+i,
    ['e','a','n','u','o','ss','ae'][i],
    zwj([0x1D5CF+i])
  ]));
});

// 8-10: 折行+特殊混合
rows.push(row(['8','fold-special','33','t8@test.com','72000','special fold','"quote""in\\ncomma,in\\ntab\\tin"','target','L'.repeat(100),'Nanjing','Kobe','Changwon','Bismillah','','  ','null','<>\'"&','data:text/html,<script>','mailto:t@t.com','2024-Jul','-Infinity','maybe','"a,b,c,d"','"""six""""','normal"in"middle','NUL','U3V','6.022e23','c',zwj([0x1F431,0x200D,0x1F464])]));
rows.push(row(['9','fold-long','38','t9@test.com','88000','long fold','"short\\n'+('long'.repeat(500))+'\\nshort"','melt','L'.repeat(5000),'Chongqing','Naha','Ulsan','Salam','','  ','nil','[]()','<body onload=alert(1)>','tel:+1-555','01/01/24','1.7e308','1','"last,field"','"tail""quote"',',ok','backspace','U3V2Y','2.22e-16','d',zwj([0x1F9D1,0x200D,0x1F4BB])]));
rows.push(row(['10','fold-emoji','22','t10@test.com','42000','emoji fold','"line1\\nline2\\nline3"','piano','L'.repeat(300),'Tianjin','Sendai','Goyang','Marhaba','','  ','empty','star','<details ontoggle=alert(1)>','svn+ssh://host','Dec 25','0.1+0.2','0','"e,f"','"""seven""""','','rn','U3V2Yj','3.14e0','h',zwj([0x1F1FA,0x1F1F3])]));

// ===== 2. 特殊字符（11-20）=====
rows.push(row(['11','Unicode-range','27','t11@test.com','51000','Unicode','plain','A-breve','short','ABCDEFG','hiragana','ganaada','DeltaTheta','','  ','null','(c)(r)(tm)','plain','https://unicode.com','2024-01-01','42','true','"a,b"','"q""uote"','normal','plain','U3V','1e0','s','frakturAB']));
rows.push(row(['12','zero-width','29','t12@test.com','53000','ZW test','plain','zwj','short','A\u200BB','plain','plain','plain','','  ','null','arrows','plain','https://example.com/a\u200Bb','2024-02-01','3.14','false','"a,b"','"q""uote"','normal','plain','U3V','2e0','z',zwj([0x1F525,0x200D,0x2764,0xFE0F])]));
rows.push(row(['13','variant-selector','31','t13@test.com','57000','VS test','plain','vs','short','red heart','plain','plain','plain','','  ','null','section','plain','https://example.com','2024-03-01','2.718','true','"a,b"','"q""uote"','normal','plain','U3V','3e0','z','heart']));
rows.push(row(['14','RTL','26','t14@test.com','49000','RTL','plain','marhaba','short','Hello Arabic World','Arabic','plain','Arabic world','','  ','null','inverted','plain','https://example.com','2024-04-01','1.618','false','"a,b"','"q""uote"','normal','plain','U3V','4e0','s','Arabic']));
rows.push(row(['15','control-chars','34','t15@test.com','73000','Control','plain','NUL','short','ctrl chars','plain','plain','plain','','  ','null','special','plain','https://example.com','2024-05-01','65535','true','"a,b"','"q""uote"','normal','plain','U3V','5e0','s','NUL-SOH']));
rows.push(row(['16','HTML-entities','36','t16@test.com','77000','HTML','plain','amp','short','lt gt amp quot apos','plain','plain','plain','','  ','null','amp lt gt','lt;scriptgt;','https://example.com?a=1&b=2','2024-06-01','256','false','"a,b"','"q""uote"','normal','plain','U3V','6e0','s','amp']));
rows.push(row(['17','URL-special','24','t17@test.com','47000','URL','plain','link','short','jp path query fragment','plain','plain','plain','','  ','null','%20%21','plain','https://example.com/path spaces','2024-07-01','1024','true','"a,b"','"q""uote"','normal','plain','U3V','7e0','s','link']));
rows.push(row(['18','binary','28','t18@test.com','54000','Binary','plain','floppy','short','U3V2YjY0IGJhc2U2NCB0ZXN0','plain','plain','plain','','  ','null','0xFF0x00','plain','data:application/octet-stream;base64,U3V2','2024-08-01','0xDEADBEEF','false','"a,b"','"q""uote"','normal','plain','U3V2','8e0','s','floppy']));
rows.push(row(['19','math-symbols','32','t19@test.com','64000','Math','plain','sum','short','sum product integral partial nabla','plain','plain','plain','','  ','null','plus minus times divide','plain','https://example.com','2024-09-01','3.14159265','true','"a,b"','"q""uote"','normal','plain','U3V','9e0','s','sum-product']));
rows.push(row(['20','currency','37','t20@test.com','81000','Currency','plain','money','short','$ euro pound yen rupee ruble won lira dong','plain','plain','plain','','  ','null','currency','plain','https://example.com','2024-10-01','1000000','false','"a,b"','"q""uote"','normal','plain','U3V','1e1','s','dollar-euro']));

// ===== 3. 数字边界（21-30）=====
const numData = [
  ['21','huge-int','39','t21@test.com','999999','huge int','plain','num','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','999999999999999999','true','"a,b"','"q""uote"','normal','plain','U3V','1e15','s','num'],
  ['22','tiny-neg','41','t22@test.com','-999999','tiny neg','plain','num','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','-999999999999999999','false','"a,b"','"q""uote"','normal','plain','U3V','-1e15','s','num'],
  ['23','float-prec','23','t23@test.com','0.1','float precision','plain','num','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','0.1+0.2','true','"a,b"','"q""uote"','normal','plain','U3V','1e-16','s','num'],
  ['24','sci-notation','25','t24@test.com','1e10','scientific','plain','num','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','6.022e23','false','"a,b"','"q""uote"','normal','plain','U3V','6e23','s','num'],
  ['25','hex','27','t25@test.com','0xFF','hexadecimal','plain','num','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','0xDEADBEEF','true','"a,b"','"q""uote"','normal','plain','U3V','1e2','s','num'],
  ['26','leading-zero','29','t26@test.com','007','leading zero','plain','num','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','0000123','false','"a,b"','"q""uote"','normal','plain','U3V','1e3','s','num'],
  ['27','percent','31','t27@test.com','99.9%','percentage','plain','num','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','50%','true','"a,b"','"q""uote"','normal','plain','U3V','5e1','s','num'],
  ['28','fraction','33','t28@test.com','1/3','fraction','plain','num','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','22/7','false','"a,b"','"q""uote"','normal','plain','U3V','2.2e0','s','num'],
  ['29','infinity','35','t29@test.com','Infinity','infinity','plain','num','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','Infinity','true','"a,b"','"q""uote"','normal','plain','U3V','1e308','s','num'],
  ['30','nan','37','t30@test.com','NaN','NaN','plain','num','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','NaN','false','"a,b"','"q""uote"','normal','plain','U3V','1e-999','s','num'],
];
numData.forEach(r => rows.push(row(r)));

// ===== 4. 日期格式变体（31-40）=====
const dateData = [
  ['31','ISO-date','29','t31@test.com','51000','ISO','plain','cal','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-15T10:30:00Z','1','true','"a,b"','"q""uote"','normal','plain','U3V','1e0','s','cal'],
  ['32','CN-date','31','t32@test.com','53000','Chinese date','plain','cal','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-1-15','2','false','"a,b"','"q""uote"','normal','plain','U3V','2e0','s','cal'],
  ['33','US-date','33','t33@test.com','55000','US date','plain','cal','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','01/15/2024','3','true','"a,b"','"q""uote"','normal','plain','U3V','3e0','s','cal'],
  ['34','EU-date','35','t34@test.com','57000','EU date','plain','cal','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','15/01/2024','4','false','"a,b"','"q""uote"','normal','plain','U3V','4e0','s','cal'],
  ['35','timestamp','37','t35@test.com','59000','timestamp','plain','cal','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','1705312200','5','true','"a,b"','"q""uote"','normal','plain','U3V','5e0','s','cal'],
  ['36','timezone','39','t36@test.com','61000','with tz','plain','cal','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-15T10:30:00+08:00','6','false','"a,b"','"q""uote"','normal','plain','U3V','6e0','s','cal'],
  ['37','time-only','41','t37@test.com','63000','time only','plain','cal','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','10:30:00','7','true','"a,b"','"q""uote"','normal','plain','U3V','7e0','s','cal'],
  ['38','relative','43','t38@test.com','65000','relative','plain','cal','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','Yesterday','8','false','"a,b"','"q""uote"','normal','plain','U3V','8e0','s','cal'],
  ['39','leap-year','45','t39@test.com','67000','leap year','plain','cal','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-02-29','9','true','"a,b"','"q""uote"','normal','plain','U3V','9e0','s','cal'],
  ['40','invalid-date','47','t40@test.com','69000','invalid date','plain','cal','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-13-45','10','false','"a,b"','"q""uote"','normal','plain','U3V','1e1','s','cal'],
];
dateData.forEach(r => rows.push(row(r)));

// ===== 5. 空值/空白变体（41-50）=====
rows.push(row(['41','all-empty','','','','all empty','','','','','','','','','','','','','','','','','','','','','','','']));
rows.push(row(['42','empty-strings','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""','""']));
rows.push(row(['43','spaces',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ']));
rows.push(row(['44','tabs','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t','\t']));
rows.push(row(['45','null-text','null','NULL','null','NULL','null','NULL','null','NULL','null','NULL','null','NULL','null','NULL','null','NULL','null','NULL','null','NULL','null','NULL','null','NULL','null','NULL','null','NULL']));
rows.push(row(['46','NA-text','N/A','n/a','N/A','n/a','N/A','n/a','N/A','n/a','N/A','n/a','N/A','n/a','N/A','n/a','N/A','n/a','N/A','n/a','N/A','n/a','N/A','n/a','N/A','n/a','N/A','n/a','N/A','n/a']));
rows.push(row(['47','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined','undefined']));
rows.push(row(['48','mixed-ws','  ',' \t','\t ','  \t  ','  ',' \t','\t ','  \t  ','  ',' \t','\t ','  \t  ','  ',' \t','\t ','  \t  ','  ',' \t','\t ','  \t  ','  ',' \t','\t ','  \t  ','  ',' \t','\t ','  \t  ','  ']));
rows.push(row(['49','zeros','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0']));
rows.push(row(['50','bool-text','false','FALSE','true','TRUE','False','True','yes','no','Y','N','on','off','ON','OFF','1','0','plain','plain','plain','plain','plain','plain','plain','plain','plain','plain','plain','plain','plain']));

// ===== 6. 引号边界（51-60）=====
const quoteData = [
  ['51','normal-quote','29','t51@test.com','51000','"quoted field"','plain','smile','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','1','true','"comma,inside"','"quote""inside"','normal','plain','U3V','1e0','s','smile'],
  ['52','triple-quote','31','t52@test.com','53000','"has""triple""quotes"','plain','smile','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','2','false','"a,b"','"""opening','normal','plain','U3V','2e0','s','smile'],
  ['53','quote-newline','33','t53@test.com','55000','"quote\\nnewline"','plain','smile','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','3','true','"a,b"','"closing"""','normal','plain','U3V','3e0','s','smile'],
  ['54','quote-comma-nl','35','t54@test.com','57000','"quote,comma\\nnewline"','plain','smile','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','4','false','"a,b,c"','"""four""""','normal','plain','U3V','4e0','s','smile'],
  ['55','only-quotes','37','t55@test.com','59000','""""""','plain','smile','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','5','true','"a,b"','"""""""','normal','plain','U3V','5e0','s','smile'],
  ['56','empty-quotes','39','t56@test.com','61000','""','plain','smile','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','6','false','"a,b"','""','normal','plain','U3V','6e0','s','smile'],
  ['57','unclosed-quote','41','t57@test.com','63000','"unclosed','plain','smile','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','7','true','"a,b"','"also unclosed','normal','plain','U3V','7e0','s','smile'],
  ['58','comma-no-quote','43','t58@test.com','65000','comma outside quotes','plain','smile','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','8','false','"a,b"','"normal"','normal','plain','U3V','8e0','s','smile'],
  ['59','quote-all-special','45','t59@test.com','67000','"<>&\'"inside"','plain','smile','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','9','true','"a,b"','"special""quote""','normal','plain','U3V','9e0','s','smile'],
  ['60','quote-emoji','47','t60@test.com','69000','"emoji inside"','plain','smile','short','plain','plain','plain','','  ','null','plain','plain','https://example.com','2024-01-01','10','false','"a,b"','"emoji""inside"','normal','plain','U3V','1e1','s','smile'],
];
quoteData.forEach(r => rows.push(row(r)));

// ===== 7. 超长文本梯度（61-70）=====
for (let i = 0; i < 10; i++) {
  const len = Math.min(100 * Math.pow(2, i), 10000);
  const id = 61 + i;
  rows.push(row([
    String(id), 'long'+len, String(20+i), 't'+id+'@test.com', String(50000+i*5000),
    'long'+len+'chars', 'plain', 'memo', 'L'.repeat(len),
    'plain', 'plain', 'plain', 'plain',
    '', '  ', 'null', 'plain', 'plain', 'https://example.com',
    '2024-01-01', String(id), i%2===0?'true':'false',
    '"a,b"', '"q""uote"', 'normal', 'plain', 'U3V', id+'e0', 's', 'memo'
  ]));
}

// ===== 8. 批量压力行（71-570）：500行 =====
const surnames = ['Zhang','Li','Wang','Zhao','Sun','Zhou','Wu','Zheng','Feng','Chen','Chu','Wei','Jiang','Shen','Han','Yang','Zhu','Qin','You','Xu'];
const cities = ['Beijing','Shanghai','Guangzhou','Shenzhen','Chengdu','Hangzhou','Wuhan','Nanjing','Chongqing','Xian','Suzhou','Tianjin','Changsha','Zhengzhou','Dongguan','Qingdao','Shenyang','Ningbo','Kunming','Dalian'];
const depts = ['Engineering','Marketing','Sales','Finance','HR','Operations','Product','Design','Legal','Admin'];

for (let i = 0; i < 500; i++) {
  const id = 71 + i;
  const name = surnames[i % 20] + (i % 100);
  const age = 20 + (i % 45);
  const salary = (30000 + i * 100).toFixed(2);
  const city = cities[i % 20];
  const dept = depts[i % 10];
  const desc = i % 10 === 0 ? '"multi\\nline\\ndesc"' : 'row'+i;
  const multiLine = i % 15 === 0 ? '"line1\\nline2\\nline3"' : 'single';
  const longText = i % 20 === 0 ? 'X'.repeat(200 + i * 5) : 't'+i;
  const emptyCol = i % 7 === 0 ? '' : 'v'+i;
  const nullCol = i % 13 === 0 ? 'null' : '';
  const dateCol = '2024-'+String((i%12)+1).padStart(2,'0')+'-'+String((i%28)+1).padStart(2,'0');
  const numEdge = i % 5 === 0 ? (i % 2 === 0 ? 'Infinity' : 'NaN') : String(i * 100);
  const boolCol = i % 2 === 0 ? 'true' : 'false';
  const quotedComma = i % 3 === 0 ? '"'+dept+', sub"' : dept;
  const quotedQuote = i % 4 === 0 ? '"has""quote""desc"' : 'desc'+i;
  const controlChar = i % 8 === 0 ? 'has\\ttab' : 'plain';
  const base64Col = i % 6 === 0 ? 'U3V2YjY0' : '';
  const sciNotation = i % 9 === 0 ? (i+1)+'e'+(i%5) : String(i);
  const diacritic = i % 11 === 0 ? 'eaoui' : '';
  const surrogate = i % 17 === 0 ? zwj([0x1D5CF + (i%10)]) : '';

  rows.push(row([
    String(id), name, String(age), 'user'+id+'@test.com', salary,
    desc, multiLine, 'emoji'+(i%20), longText,
    city, 'JP'+(i%5), 'KR'+(i%5), 'AR'+(i%5),
    emptyCol, '  ', nullCol,
    dept, '<b>bold</b>', 'https://example.com/'+id,
    dateCol, numEdge, boolCol,
    quotedComma, quotedQuote, 'normal',
    controlChar, base64Col, sciNotation,
    diacritic, surrogate
  ]));
}

// 输出
const output = rows.join('\n');
const outPath = path.join(__dirname, 'edge-cases-边界测试.csv');
fs.writeFileSync(outPath, output, 'utf8');
console.log('Generated: ' + outPath);
console.log('Rows: ' + rows.length + ' (including header)');
console.log('Columns: ' + COLS);
console.log('Size: ' + (Buffer.byteLength(output) / 1024).toFixed(1) + ' KB');
