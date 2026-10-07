/*!
 *  辽宁穷胡 — 出牌建议面板
 */
"use strict";

const Advisor = Majiang.AI.Advisor;

function render_pai_list(pai_fn, items) {
    if (! items || ! items.length) return $('<span>').text('—');
    const wrap = $('<span class="pai-list">');
    for (let y of items) {
        const cell = $('<span class="youxiao-item">');
        if (pai_fn && y.p) cell.append(pai_fn(y.p.slice(0, 2)));
        else cell.append($('<span>').text(y.name || y.p));
        cell.append($('<span class="n">').text(`×${y.n}`));
        wrap.append(cell);
    }
    return wrap;
}

module.exports = class HintPanel {

    constructor(root, pai_fn, storage_key = 'Majiang.liaoning.hints') {
        this._root = root;
        this._pai  = pai_fn;
        this._key  = storage_key;
        this._enabled = localStorage.getItem(storage_key) !== '0';
        this._player = null;
        this._draw();
        this._bind();
        this.update_toggle();
    }

    _draw() {
        if (! this._root.find('.hint-panel').length) {
            this._root.append(`
              <div class="hint-panel">
                <div class="hint-head">
                  <span class="hint-title">出牌建议</span>
                  <label class="hint-toggle">
                    <input type="checkbox" class="hint-on"> 显示提示
                  </label>
                </div>
                <div class="hint-body">
                  <div class="hint-xiangting"></div>
                  <div class="hint-recommend"></div>
                  <div class="hint-reason"></div>
                  <div class="hint-youxiao"><span class="label">有效牌</span><span class="list"></span></div>
                  <div class="hint-warnings"></div>
                  <div class="hint-fulou"></div>
                  <div class="hint-defense"></div>
                </div>
              </div>`);
        }
        this._node = {
            panel:     this._root.find('.hint-panel'),
            checkbox:  this._root.find('.hint-on'),
            body:      this._root.find('.hint-body'),
            xiangting: this._root.find('.hint-xiangting'),
            recommend: this._root.find('.hint-recommend'),
            reason:    this._root.find('.hint-reason'),
            youxiao:   this._root.find('.hint-youxiao .list'),
            warnings:  this._root.find('.hint-warnings'),
            fulou:     this._root.find('.hint-fulou'),
            defense:   this._root.find('.hint-defense'),
        };
    }

    _bind() {
        this._node.checkbox.on('change', ()=>{
            this._enabled = this._node.checkbox.prop('checked');
            localStorage.setItem(this._key, this._enabled ? '1' : '0');
            this.update_toggle();
            if (this._enabled && this._player) this.refresh();
        });
    }

    update_toggle() {
        this._node.checkbox.prop('checked', this._enabled);
        if (this._enabled) {
            this._node.body.show();
            this._node.panel.addClass('on');
        }
        else {
            this._node.body.hide();
            this._node.panel.removeClass('on');
        }
    }

    attach(player) {
        this._player = player;
    }

    refresh(extra = {}) {
        if (! this._enabled || ! this._player) return;
        const advice = Advisor.advise(this._player, { hints: true });
        this.render(advice, extra.fulou);
    }

    render(advice, fulou_tips) {
        if (! advice || advice.enabled === false) {
            this._node.xiangting.text('');
            return;
        }
        this._node.xiangting.text(advice.xiangting_text || '');

        if (advice.recommend) {
            const r = advice.recommend;
            if (r.action == 'zimo') {
                this._node.recommend.text('建议：自摸');
            }
            else {
                this._node.recommend.empty()
                    .append($('<span>').text('建议打出 '))
                    .append(this._pai(r.p.slice(0, 2)))
                    .append($('<span>').text(`（${r.name}）`));
            }
        }
        else {
            this._node.recommend.text('');
        }

        this._node.reason.text(advice.reason || '');
        this._node.youxiao.empty()
            .append(render_pai_list(this._pai, advice.youxiao));

        this._node.warnings.empty();
        for (let w of advice.warnings || []) {
            this._node.warnings.append($('<div class="warn">').text(w));
        }

        this._node.fulou.empty();
        const tips = fulou_tips || advice.fulou;
        if (tips && tips.length) {
            for (let t of tips) {
                this._node.fulou.append($('<div>').text(t.text));
            }
        }

        this._node.defense.empty();
        for (let d of advice.defense || []) {
            this._node.defense.append($('<div class="def">').text(d));
        }
    }

    clear() {
        this._node.xiangting.text('');
        this._node.recommend.text('');
        this._node.reason.text('');
        this._node.youxiao.empty();
        this._node.warnings.empty();
        this._node.fulou.empty();
        this._node.defense.empty();
    }
};
