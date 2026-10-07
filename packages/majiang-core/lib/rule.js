/*
 *  Majiang.rule
 */
"use strict";

module.exports = function(param = {}) {

    let rule = {
        /* 规则类型: '日本麻将' | '辽宁穷胡' */
        '规则类型':     '日本麻将',
        '穷胡底分':     2,

        /* 辽宁穷胡可选条件 (默认关闭) */
        '三门齐':       false,
        '必须开门':     false,
        '有刻子':       false,

        /* 点数関連 */
        '配給原点': 25000,
        '順位点':   ['20.0','10.0','-10.0','-20.0'],
        '連風牌は2符': false,

        /* 赤牌有無/クイタンなど */
        '赤牌':         { m: 1, p: 1, s: 1 },
        'クイタンあり': true,
        '喰い替え許可レベル': 0,
            // 0: 喰い替えなし, 1: スジ喰い替えあり,  2: 現物喰い替えもあり

        /* 局数関連 */
        '場数':             2,
            // 0: 一局戦, 1: 東風戦, 2： 東南戦, 4: 一荘戦
        '途中流局あり':     true,
        '流し満貫あり':     true,
        'ノーテン宣言あり': false,
        'ノーテン罰あり':   true,
        '最大同時和了数': 2,
            // 1: 頭ハネ, 2: ダブロンあり, 3: トリロンあり
        '連荘方式':         2,
            // 0: 連荘なし, 1: 和了連荘, 2: テンパイ連荘, 3: ノーテン連荘
        'トビ終了あり':     true,
        'オーラス止めあり': true,
        '延長戦方式':       1,
            // 0: 延長戦なし, 1: サドンデス, 2: 連荘優先サドンデス, 3: 4局固定

        /* リーチ/ドラ関連 */
        '一発あり':         true,
        '裏ドラあり':       true,
        'カンドラあり':     true,
        'カン裏あり':       true,
        'カンドラ後乗せ':   true,
        'ツモ番なしリーチあり':   false,
        'リーチ後暗槓許可レベル': 2,
            // 0: 暗槓不可, 1: 牌姿の変わる暗槓不可, 2： 待ちの変わる暗槓不可

        /* 役満関連 */
        '役満の複合あり':   true,
        'ダブル役満あり':   true,
        '数え役満あり':     true,
        '役満パオあり':     true,
        '切り上げ満貫あり': false,
    };

    for (let key of Object.keys(param)) {
        rule[key] = param[key];
    }

    // Liaoning preset: disable Japanese-specific features unless overridden
    if (rule['规则类型'] == '辽宁穷胡' || param.liaoning) {
        rule['规则类型'] = '辽宁穷胡';
        rule.liaoning = true;
        if (param['赤牌'] === undefined)
            rule['赤牌'] = { m: 0, p: 0, s: 0 };
        if (param['クイタンあり'] === undefined)
            rule['クイタンあり'] = false;
        if (param['一発あり'] === undefined)
            rule['一発あり'] = false;
        if (param['裏ドラあり'] === undefined)
            rule['裏ドラあり'] = false;
        if (param['カンドラあり'] === undefined)
            rule['カンドラあり'] = false;
        if (param['カン裏あり'] === undefined)
            rule['カン裏あり'] = false;
        if (param['カンドラ後乗せ'] === undefined)
            rule['カンドラ後乗せ'] = false;
        if (param['流し満貫あり'] === undefined)
            rule['流し満貫あり'] = false;
        if (param['途中流局あり'] === undefined)
            rule['途中流局あり'] = false;
        if (param['ノーテン罰あり'] === undefined)
            rule['ノーテン罰あり'] = false;
        if (param['配給原点'] === undefined)
            rule['配給原点'] = 100;
        if (param['場数'] === undefined)
            rule['場数'] = 1; // 东风战 — shorter for demo
        if (param['喰い替え許可レベル'] === undefined)
            rule['喰い替え許可レベル'] = 2; // chi freely
        if (param['最大同時和了数'] === undefined)
            rule['最大同時和了数'] = 1; // 截胡
    }

    return rule;
}
