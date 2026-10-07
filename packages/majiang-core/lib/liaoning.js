/*
 *  Liaoning Qionghu (辽宁穷胡) helpers
 */
"use strict";

const YAOJIU_RE = /[mps][19]|z[1-7]/;
const ZIPAI_RE  = /^z/;
const KEZI_RE   = /^[mpsz](\d)\1\1/;
const GANG_RE   = /^[mpsz](\d)\1\1.*\1/;
const SHUNZI_RE = /^[mps]\d{3}/;
const KANZHANG  = /^[mps]\d\d[\+\=\-\_]\!\d$/;
const BIANZHANG = /^[mps](123[\+\=\-\_]\!|7[\+\=\-\_]\!89)$/;
const DANQI     = /^[mpsz](\d)\1[\+\=\-\_]\!$/;

/**
 * Winning hand must contain at least one 1/9, or any honor (風/箭) may
 * substitute for that 幺九 requirement (缺幺断九不能胡).
 */
function has_yaojiu_or_zipai(mianzi) {
    for (let m of mianzi) {
        const t = m.replace(/0/g, '5');
        if (t.match(YAOJIU_RE)) return true;
    }
    return false;
}

/**
 * 夹胡: 坎张、边张 (12→3 / 89→7), and 单钓 (so 飘胡+单钓 can stack).
 * 吃 does not block 夹胡. 两面/对倒 are not 夹胡.
 */
function is_jiahu(mianzi) {
    for (let m of mianzi) {
        if (m.match(KANZHANG) || m.match(BIANZHANG) || m.match(DANQI))
            return true;
    }
    return false;
}

/** 飘胡: four pungs/kongs + one pair (no sequences). */
function is_piaohu(mianzi) {
    if (mianzi.length != 5) return false;
    let n_kezi = 0;
    for (let i = 1; i < mianzi.length; i++) {
        const m = mianzi[i].replace(/0/g, '5');
        if (m.match(KEZI_RE) || m.match(GANG_RE)) n_kezi++;
        else if (m.match(SHUNZI_RE)) return false;
        else return false;
    }
    return n_kezi == 4;
}

/** Optional: 三门齐 — hand uses all three suits. */
function has_sanmenqi(mianzi) {
    const suits = { m: false, p: false, s: false };
    for (let m of mianzi) {
        const s = m[0];
        if (suits[s] !== undefined) suits[s] = true;
    }
    return suits.m && suits.p && suits.s;
}

/** Optional: 必须开门 — at least one open meld. */
function has_kaimen(mianzi) {
    return mianzi.some(m => m.match(/[\+\=\-](?!\!)/));
}

/** Optional: 有刻子 — at least one pung/kong. */
function has_kezi(mianzi) {
    for (let i = 0; i < mianzi.length; i++) {
        const m = mianzi[i].replace(/0/g, '5');
        if (i == 0) continue; // pair
        if (m.match(KEZI_RE) || m.match(GANG_RE)) return true;
    }
    return false;
}

/**
 * Whether a completed mianzi set is a legal Liaoning win under rule toggles.
 */
function allow_liaoning_hule(mianzi, rule) {
    if (mianzi.length != 5) return false; // standard shape only
    if (! has_yaojiu_or_zipai(mianzi)) return false;
    if (rule['三门齐'] && ! has_sanmenqi(mianzi)) return false;
    if (rule['必须开门'] && ! has_kaimen(mianzi)) return false;
    if (rule['有刻子'] && ! has_kezi(mianzi)) return false;
    return true;
}

/**
 * Build hupai list and multiplier for a legal Liaoning win.
 * Base win = 1 fan; 夹胡 and 飘胡 each add 1 fan (each doubles score).
 */
function liaoning_hupai(mianzi, rongpai, rule) {
    if (! allow_liaoning_hule(mianzi, rule)) return null;

    const hupai = [{ name: '穷胡', fanshu: 1 }];
    let multiplier = 1;

    const jia = is_jiahu(mianzi);
    const piao = is_piaohu(mianzi);

    if (jia) {
        hupai.push({ name: '夹胡', fanshu: 1, multiplier: 2 });
        multiplier *= 2;
    }
    if (piao) {
        hupai.push({ name: '飘胡', fanshu: 1, multiplier: 2 });
        multiplier *= 2;
    }

    if (! rongpai) {
        hupai.push({ name: '自摸', fanshu: 1 });
    }

    return { hupai, jiahu: jia, piaohu: piao, multiplier };
}

/**
 * Score a Liaoning win. Returns same shape as Japanese get_defen result.
 * Score = 底分 × 2^额外番 (夹胡/飘胡/自摸 each count), paid by baojia or all.
 */
function liaoning_defen(mianzi, rongpai, param) {
    const info = liaoning_hupai(mianzi, rongpai, param.rule);
    if (! info) return { defen: 0 };

    const base = param.rule['穷胡底分'] || 2;
    const fanshu = info.hupai.map(h => h.fanshu).reduce((a, b) => a + b, 0);
    // Each fan doubles: base * 2^(fanshu-1) so 穷胡 alone = base
    const points = base * Math.pow(2, Math.max(fanshu - 1, 0));

    const menfeng = param.menfeng;
    const fenpei = [0, 0, 0, 0];
    let defen;

    if (rongpai) {
        const baojia = (menfeng + { '+': 1, '=': 2, '-': 3 }[rongpai[2]]) % 4;
        defen = points;
        fenpei[menfeng] += defen;
        fenpei[baojia]  -= defen;
    }
    else {
        // zimo: each of the other three pays `points`
        defen = points * 3;
        for (let l = 0; l < 4; l++) {
            if (l == menfeng) fenpei[l] += defen;
            else              fenpei[l] -= points;
        }
    }

    return {
        hupai:      info.hupai,
        fu:         undefined,
        fanshu:     fanshu,
        damanguan:  undefined,
        defen:      defen,
        fenpei:     fenpei,
        jiahu:      info.jiahu,
        piaohu:     info.piaohu,
        multiplier: info.multiplier,
        di:         base,
    };
}

function is_liaoning(rule) {
    return rule && (rule['规则类型'] == '辽宁穷胡'
                 || rule['規則類型'] == '辽宁穷胡'
                 || rule['liaoning'] === true);
}

module.exports = {
    has_yaojiu_or_zipai,
    is_jiahu,
    is_piaohu,
    has_sanmenqi,
    has_kaimen,
    has_kezi,
    allow_liaoning_hule,
    liaoning_hupai,
    liaoning_defen,
    is_liaoning,
    KANZHANG,
    BIANZHANG,
};
