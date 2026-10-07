/*
 *  Liaoning discard / call advisor (出牌建议)
 */
"use strict";

const Majiang = require('@kobalab/majiang-core');
const Liaoning = Majiang.Liaoning;

const PAI_NAME = {
    m1:'一万',m2:'二万',m3:'三万',m4:'四万',m5:'五万',
    m6:'六万',m7:'七万',m8:'八万',m9:'九万',
    p1:'一筒',p2:'二筒',p3:'三筒',p4:'四筒',p5:'五筒',
    p6:'六筒',p7:'七筒',p8:'八筒',p9:'九筒',
    s1:'一条',s2:'二条',s3:'三条',s4:'四条',s5:'五条',
    s6:'六条',s7:'七条',s8:'八条',s9:'九条',
    z1:'东',z2:'南',z3:'西',z4:'北',z5:'白',z6:'发',z7:'中',
};

function pai_label(p) {
    p = (p || '').replace(/0/, '5').slice(0, 2);
    return PAI_NAME[p] || p;
}

function is_yaojiu_or_zi(p) {
    p = (p || '').replace(/0/, '5');
    return /[mps][19]/.test(p) || p[0] == 'z';
}

function count_yaojiu_zi(shoupai) {
    let n = 0;
    for (let s of ['m','p','s']) {
        n += shoupai._bingpai[s][1] + shoupai._bingpai[s][9];
    }
    for (let i = 1; i <= 7; i++) n += shoupai._bingpai.z[i];
    for (let m of shoupai._fulou) {
        if (m.match(/[mps][19]|z[1-7]/)) n += 3;
    }
    return n;
}

/** Count visible tiles from all he (discards) + fulou + own hand. */
function visible_counts(model, menfeng) {
    const counts = {
        m: [0,0,0,0,0,0,0,0,0,0],
        p: [0,0,0,0,0,0,0,0,0,0],
        s: [0,0,0,0,0,0,0,0,0,0],
        z: [0,0,0,0,0,0,0,0],
    };
    function add(p, n = 1) {
        if (! p) return;
        const s = p[0], d = +p[1] || 5;
        counts[s][d] += n;
    }
    for (let l = 0; l < 4; l++) {
        const he = model.he[l];
        if (he && he._pai) {
            for (let p of he._pai) add(p.replace(/[\+\=\-\*\_]/g, ''));
        }
        const sp = model.shoupai[l];
        if (! sp) continue;
        for (let m of sp._fulou) {
            for (let n of m.match(/\d/g) || []) add(m[0] + n);
        }
        if (l == menfeng) {
            for (let s of ['m','p','s','z']) {
                const bp = sp._bingpai[s];
                for (let n = 1; n < bp.length; n++) {
                    if (bp[n]) counts[s][n] += bp[n];
                }
            }
        }
    }
    return counts;
}

function remaining(p, visible) {
    p = p.replace(/0/, '5').slice(0, 2);
    const s = p[0], n = +p[1];
    return Math.max(0, 4 - (visible[s][n] || 0));
}

/**
 * Build advice for the current player turn.
 * @param {Majiang.Player} player  — AI or human player with model
 * @param {object} [opts]
 * @param {boolean} [opts.hints=true]
 */
function advise(player, opts = {}) {
    if (opts.hints === false) return { enabled: false };

    const shoupai = player.shoupai;
    if (! shoupai) return { enabled: true, message: '等待开局…' };

    const model = player._model;
    const n_xiangting = Majiang.Util.xiangting(shoupai);
    const visible = visible_counts(model, player._menfeng);
    const paishu_left = model.shan ? model.shan.paishu : 0;
    const late = paishu_left <= 20;

    const result = {
        enabled: true,
        n_xiangting,
        xiangting_text: n_xiangting < 0 ? '已胡'
                      : n_xiangting == 0 ? '听牌'
                      : `${n_xiangting}向听`,
        recommend: null,
        reason: '',
        youxiao: [],
        warnings: [],
        defense: [],
        fulou: null,
        rule_notes: [],
    };

    // —— 有效牌（听牌或向听前进）——
    if (n_xiangting == 0) {
        const tingpai = Majiang.Util.tingpai(shoupai) || [];
        result.youxiao = tingpai.map(p => ({
            p, name: pai_label(p), n: remaining(p, visible),
        }));
        // Check if waits produce legal Liaoning wins
        if (Liaoning.is_liaoning(player._rule)) {
            const legal = [];
            for (let p of tingpai) {
                const ok = Majiang.Game.allow_hule(
                    player._rule, shoupai, p + '+',
                    model.zhuangfeng, player._menfeng, false, true);
                if (ok) legal.push(p);
                else result.warnings.push(
                    `听 ${pai_label(p)} 但缺幺断九（或可选条件）不能胡`);
            }
            result.youxiao = result.youxiao.filter(y => legal.includes(y.p));
        }
    }
    else if (n_xiangting > 0 && shoupai._zimo) {
        // Find discards that improve / keep shanten and list ukeire
        const dapai_list = Majiang.Game.get_dapai(player._rule, shoupai) || [];
        let best = null;
        for (let p of dapai_list) {
            const next = shoupai.clone().dapai(p);
            const x = Majiang.Util.xiangting(next);
            if (x > n_xiangting) continue;
            const ukeire = (Majiang.Util.tingpai(next) || []).map(t => ({
                p: t, name: pai_label(t), n: remaining(t, visible),
            }));
            const n_uke = ukeire.reduce((a, y) => a + y.n, 0);
            const yao_warn = is_yaojiu_or_zi(p)
                && count_yaojiu_zi(next) == 0;
            const cand = { p, name: pai_label(p), x, n_uke, ukeire, yao_warn };
            if (! best
                || cand.x < best.x
                || (cand.x == best.x && cand.n_uke > best.n_uke)
                || (cand.x == best.x && cand.n_uke == best.n_uke
                    && best.yao_warn && ! cand.yao_warn)) {
                best = cand;
            }
        }
        if (best) {
            result.recommend = { p: best.p, name: best.name };
            result.youxiao = best.ukeire;
            result.reason = best.x < n_xiangting
                ? `打 ${best.name} 可进张至 ${best.x}向听（余 ${best.n_uke} 张）`
                : `打 ${best.name} 维持 ${best.x}向听，进张最多（余 ${best.n_uke} 张）`;
            if (best.yao_warn) {
                result.warnings.push(
                    `⚠ 打出最后的幺九/字牌后将断幺，可能无法胡牌`);
            }
        }
    }
    else if (n_xiangting == 0 && shoupai._zimo) {
        // Already tenpai with drawn tile — may tsumo or discard
        if (player.allow_hule && player.allow_hule(shoupai, null)) {
            result.recommend = { p: null, name: '自摸', action: 'zimo' };
            result.reason = '已可自摸和牌';
        }
        else {
            const dapai_list = Majiang.Game.get_dapai(player._rule, shoupai) || [];
            for (let p of dapai_list) {
                const next = shoupai.clone().dapai(p);
                if (Majiang.Util.xiangting(next) == 0) {
                    result.recommend = { p, name: pai_label(p) };
                    result.reason = `打 ${pai_label(p)} 保持听牌`;
                    const tingpai = Majiang.Util.tingpai(next) || [];
                    result.youxiao = tingpai.map(t => ({
                        p: t, name: pai_label(t), n: remaining(t, visible),
                    }));
                    if (is_yaojiu_or_zi(p) && count_yaojiu_zi(next) == 0) {
                        result.warnings.push(
                            `⚠ 打出最后的幺九/字牌后将断幺，可能无法胡牌`);
                    }
                    break;
                }
            }
        }
    }

    // —— 若 AI 提供 select_dapai，用其建议并附理由 ——
    if (typeof player.select_dapai == 'function' && shoupai._zimo
            && n_xiangting >= 0) {
        try {
            const info = [];
            const ai_p = player.select_dapai(info);
            if (ai_p) {
                const name = pai_label(ai_p);
                if (! result.recommend || result.recommend.p != ai_p.slice(0,2)) {
                    result.recommend = { p: ai_p, name };
                    const row = info.find(i => i.p && i.p.slice(0,2) == ai_p.slice(0,2));
                    if (row) {
                        result.reason = `AI 建议打 ${name}`
                            + (row.ev != null ? `（评估 ${Math.round(row.ev)}）` : '')
                            + (row.n_xiangting != null
                                ? `，向听 ${row.n_xiangting}` : '');
                    }
                    else if (! result.reason) {
                        result.reason = `AI 建议打 ${name}`;
                    }
                }
            }
        }
        catch (e) { /* ignore AI errors in advisor */ }
    }

    // —— 吃碰杠建议（当有来牌时由调用方传入）——
    // handled via advise_fulou()

    // —— 防御：末巡危险牌 ——
    if (late) {
        result.defense.push('末巡：注意对手未现的 3–7 中张');
        // tiles that complete visible peng patterns (pair in discard of others? 
        // simpler: warn about tiles that appear as pairs in opponents' open melds waiting third)
        for (let l = 0; l < 4; l++) {
            if (l == player._menfeng) continue;
            const sp = model.shoupai[l];
            if (! sp) continue;
            // If opponent has open pung already, nothing; look at discards for pairs? 
            // Flag: if we hold a tile and two are already visible from one player’s area — skip
        }
        // Unseen mid tiles held
        const dangerous = [];
        for (let s of ['m','p','s']) {
            for (let n = 3; n <= 7; n++) {
                const held = shoupai._bingpai[s][n];
                if (! held) continue;
                const rem = remaining(s + n, visible);
                // remaining counts tiles not visible; if we hold some, "unseen to others"
                if (held > 0 && rem <= 2) {
                    dangerous.push(pai_label(s + n));
                }
            }
        }
        if (dangerous.length) {
            result.defense.push(
                '对手可能需要的中张（谨慎打出）: ' + dangerous.slice(0, 6).join('、'));
        }
    }

    // Yaojiu last-copy warning even without recommend path
    if (shoupai._zimo && count_yaojiu_zi(shoupai) <= 2) {
        const only = [];
        for (let s of ['m','p','s']) {
            if (shoupai._bingpai[s][1] == 1) only.push(s + '1');
            if (shoupai._bingpai[s][9] == 1) only.push(s + '9');
        }
        for (let i = 1; i <= 7; i++) {
            if (shoupai._bingpai.z[i] == 1) only.push('z' + i);
        }
        if (only.length && count_yaojiu_zi(shoupai) == only.length) {
            result.warnings.push(
                '手中幺九/字牌所剩无几，打出后可能断幺不能胡: '
                + only.map(pai_label).join('、'));
        }
    }

    return result;
}

/**
 * Advice when an opponent discards and we can chi/peng/gang/rong.
 */
function advise_fulou(player, dapai) {
    if (! dapai || ! dapai.p) return null;
    const shoupai = player.shoupai;
    const p = dapai.p.slice(0, 2);
    const d = ['','+','=','-'][(4 + player._model.lunban - player._menfeng) % 4];
    const rp = p + d;

    const tips = [];

    if (player.allow_hule && player.allow_hule(shoupai, rp)) {
        tips.push({ action: 'rong', text: `建议荣和 ${pai_label(p)}` });
    }

    const gang = player.get_gang_mianzi ? player.get_gang_mianzi(shoupai, rp) : [];
    const peng = player.get_peng_mianzi ? player.get_peng_mianzi(shoupai, rp) : [];
    const chi  = player.get_chi_mianzi  ? player.get_chi_mianzi(shoupai, rp)  : [];

    const n0 = Majiang.Util.xiangting(shoupai);

    for (let m of [].concat(gang, peng, chi)) {
        const next = shoupai.clone().fulou(m);
        const n1 = Majiang.Util.xiangting(next);
        let kind = m.match(/\d{4}/) ? '杠'
                 : m.match(/[\+\=\-](\d)?$/) && m.match(/(\d)\1\1/) ? '碰'
                 : '吃';
        if (n1 < n0) {
            tips.push({
                action: kind == '吃' ? 'chi' : kind == '碰' ? 'peng' : 'gang',
                m, text: `建议${kind}：向听 ${n0} → ${n1}`,
            });
        }
        else if (n1 == n0 && kind != '吃') {
            tips.push({
                action: kind == '碰' ? 'peng' : 'gang',
                m, text: `${kind}后维持 ${n1}向听（可考虑）`,
            });
        }
    }

    return tips.length ? tips : null;
}

module.exports = {
    advise,
    advise_fulou,
    pai_label,
    visible_counts,
    remaining,
    is_yaojiu_or_zi,
};
