/**
 * 真 webview 交互：点击表头 sort-btn。
 * 验证：
 *   - 单击发出 sortColumn 消息（默认升序）
 *   - 再点同一列发出降序
 *   - th 上会补上 sort-asc / sort-desc 类
 *   - 点击 sort-btn 时不会同时启动「列选中 / 列 reorder」
 */
import assert from 'assert';
import { describe, it, before, after } from 'node:test';
import { createHarness, Harness } from './helpers/webview-harness';

describe('Webview sort-btn interactions', () => {
  let h: Harness;

  before(() => {
    h = createHarness({
      columns: 3,
      addSerialIndex: true,
      fontSize: 14,
      rowHeightMode: 'firstline',
      header: { absRow: 0, cells: ['Name', 'Age', 'City'] },
      body: [
        { absRow: 1, cells: ['Alice', '30', 'NYC'] },
        { absRow: 2, cells: ['Bob',   '25', 'LA'] },
        { absRow: 3, cells: ['Cindy', '28', 'SF'] },
      ],
    });
  });

  after(() => h.destroy());

  it('clicking a header sort-btn posts sortColumn ascending', () => {
    const btn = h.getSortBtn(1);
    assert.ok(btn, 'sort-btn should exist for column 1');

    h.fireMouse('mousedown', btn!, { clientX: 0, clientY: 0 });
    h.fireMouse('click', btn!, { clientX: 0, clientY: 0 });

    const sortMsgs = h.posted.filter(m => m.type === 'sortColumn');
    assert.strictEqual(sortMsgs.length, 1, 'exactly one sortColumn message');
    assert.strictEqual(sortMsgs[0].index, 1);
    assert.strictEqual(sortMsgs[0].ascending, true);

    const th = h.getHeader(1)!;
    assert.ok(th.classList.contains('sort-asc'), 'th should get sort-asc class');
    assert.ok(!th.classList.contains('sort-desc'));
  });

  it('clicking the same sort-btn again toggles to descending', () => {
    const btn = h.getSortBtn(1)!;
    h.fireMouse('mousedown', btn, { clientX: 0, clientY: 0 });
    h.fireMouse('click', btn, { clientX: 0, clientY: 0 });

    const sortMsgs = h.posted.filter(m => m.type === 'sortColumn');
    assert.strictEqual(sortMsgs.length, 2);
    assert.strictEqual(sortMsgs[1].ascending, false);

    const th = h.getHeader(1)!;
    assert.ok(th.classList.contains('sort-desc'));
    assert.ok(!th.classList.contains('sort-asc'));
  });

  it('clicking sort-btn does NOT select the column or start reorder', () => {
    const btn = h.getSortBtn(2)!;
    h.fireMouse('mousedown', btn, { clientX: 0, clientY: 0 });
    h.fireMouse('click', btn, { clientX: 0, clientY: 0 });

    // No reorderColumns should ever be posted as a side-effect
    const reorder = h.posted.filter(m => m.type === 'reorderColumns');
    assert.strictEqual(reorder.length, 0);

    // Other data cells in that column should not end up `.selected`
    const cell = h.getCell(1, 2)!;
    assert.ok(!cell.classList.contains('selected'), 'data cell should not be selected');
  });

  it('clicking a different column resets to ascending', () => {
    const btn = h.getSortBtn(0)!;
    h.fireMouse('mousedown', btn, { clientX: 0, clientY: 0 });
    h.fireMouse('click', btn, { clientX: 0, clientY: 0 });

    const last = h.posted[h.posted.length - 1];
    assert.strictEqual(last.type, 'sortColumn');
    assert.strictEqual(last.index, 0);
    assert.strictEqual(last.ascending, true);

    // old column's sort class cleared
    assert.ok(!h.getHeader(1)!.classList.contains('sort-asc'));
    assert.ok(!h.getHeader(1)!.classList.contains('sort-desc'));
    // new column marked
    assert.ok(h.getHeader(0)!.classList.contains('sort-asc'));
  });
});
