const assert = require('assert');
const Majiang = require('../');
const Liaoning = Majiang.Liaoning;

const rule = Majiang.rule({ '规则类型': '辽宁穷胡' });
const param = (extra = {}) => Majiang.Util.hule_param(Object.assign({
    rule: rule,
    menfeng: 1,
    zhuangfeng: 0,
}, extra));

suite('辽宁穷胡规则', ()=>{

    suite('缺幺断九不能胡', ()=>{
        test('纯断幺手不能胡', ()=>{
            // 14 枚已和形，但全是 2–8、无字牌
            const shoupai = Majiang.Shoupai.fromString('m234p456s678m22233');
            assert.equal(Majiang.Util.xiangting(shoupai), -1);
            const hule = Majiang.Util.hule(shoupai, null, param());
            assert.ok(! hule || ! hule.defen, '断幺手应不能和了');
        });

        test('有幺九可以胡', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m123p456s789z11122');
            const hule = Majiang.Util.hule(shoupai, null, param());
            assert.ok(hule && hule.defen > 0);
            assert.ok(hule.hupai.some(h => h.name == '穷胡'));
        });

        test('字牌可替代幺九要求（风）', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m234p456s678z1112');
            const hule = Majiang.Util.hule(shoupai, 'z2+', param());
            assert.ok(hule && hule.defen > 0, '风牌应可替代幺九');
        });

        test('字牌可替代幺九要求（中发白）', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m234p456s678z7772');
            const hule = Majiang.Util.hule(shoupai, 'z2+', param());
            assert.ok(hule && hule.defen > 0, '箭牌应可替代幺九');
        });

        test('副露中的幺九也算', ()=>{
            // 副露碰 1 万（m111-）；闭门听雀头 m2
            const shoupai = Majiang.Shoupai.fromString('m234p456s678m2,m111-');
            assert.ok(shoupai._fulou.length == 1, '副露应解析成功');
            const hule = Majiang.Util.hule(shoupai, 'm2+', param());
            assert.ok(hule && hule.defen > 0, '副露幺九应满足要求');
        });
    });

    suite('夹胡翻一番', ()=>{
        test('坎张和了算夹胡', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m13p456s789z11122');
            const hule = Majiang.Util.hule(shoupai, 'm2+', param());
            assert.ok(hule && hule.defen > 0);
            assert.ok(hule.jiahu, '应为夹胡');
            assert.ok(hule.hupai.some(h => h.name == '夹胡'));
        });

        test('边张 12→3 算夹胡', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m12p456s789z11122');
            const hule = Majiang.Util.hule(shoupai, 'm3+', param());
            assert.ok(hule && hule.jiahu, '12听3应为夹胡');
        });

        test('边张 89→7 算夹胡', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m89p456s123z11122');
            const hule = Majiang.Util.hule(shoupai, 'm7+', param());
            assert.ok(hule && hule.jiahu, '89听7应为夹胡');
        });

        test('吃后仍可夹胡', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m13s789z11122,p4-56');
            const hule = Majiang.Util.hule(shoupai, 'm2+', param());
            assert.ok(hule && hule.jiahu, '吃后坎张仍算夹胡');
            assert.ok(hule.hupai.some(h => h.name == '夹胡'));
        });

        test('两面听不算夹胡', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m23p456s789z11122');
            const hule = Majiang.Util.hule(shoupai, 'm4+', param());
            assert.ok(hule && hule.defen > 0);
            assert.ok(! hule.jiahu, '两面听不应算夹胡');
        });

        test('夹胡使分数翻倍', ()=>{
            const base_sp = Majiang.Shoupai.fromString('m23p456s789z11122');
            const jia_sp  = Majiang.Shoupai.fromString('m13p456s789z11122');
            const base = Majiang.Util.hule(base_sp, 'm4+', param());
            const jia  = Majiang.Util.hule(jia_sp,  'm2+', param());
            assert.equal(jia.defen, base.defen * 2);
        });
    });

    suite('飘胡', ()=>{
        test('对对胡算飘胡', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m111p222s333z2223');
            const hule = Majiang.Util.hule(shoupai, 'z3+', param());
            assert.ok(hule && hule.piaohu, '应为飘胡');
            assert.ok(hule.hupai.some(h => h.name == '飘胡'));
        });

        test('有顺子不算飘胡', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m123p222s333z2223');
            const hule = Majiang.Util.hule(shoupai, 'z3+', param());
            assert.ok(hule && hule.defen > 0);
            assert.ok(! hule.piaohu);
        });

        test('碰后飘胡仍成立', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m111s333z2223,p222+');
            const hule = Majiang.Util.hule(shoupai, 'z3+', param());
            assert.ok(hule && hule.piaohu);
        });
    });

    suite('夹胡与飘胡叠加', ()=>{
        test('飘胡单钓同时算夹胡，分数叠乘四倍', ()=>{
            const base_sp = Majiang.Shoupai.fromString('m23p456s789z11122');
            const base = Majiang.Util.hule(base_sp, 'm4+', param());

            const both_sp = Majiang.Shoupai.fromString('m111p222s333z2223');
            const both = Majiang.Util.hule(both_sp, 'z3+', param());
            assert.ok(both.piaohu, '应为飘胡');
            assert.ok(both.jiahu, '单钓应算夹胡');
            assert.equal(both.multiplier, 4);
            assert.ok(both.hupai.some(h => h.name == '夹胡'));
            assert.ok(both.hupai.some(h => h.name == '飘胡'));
            assert.equal(both.defen, base.defen * 4);
        });

        test('坎张夹胡 multiplier 为 2', ()=>{
            const jia_sp = Majiang.Shoupai.fromString('m13p456s789z11122');
            const jia = Majiang.Util.hule(jia_sp, 'm2+', param());
            assert.equal(jia.multiplier, 2);
            assert.ok(jia.jiahu);
            assert.ok(! jia.piaohu);
        });
    });

    suite('可选规则默认关闭', ()=>{
        test('默认不要求三门齐', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m123p456m789p22233');
            const hule = Majiang.Util.hule(shoupai, null, param());
            assert.ok(hule && hule.defen > 0);
        });

        test('开启三门齐后缺门不能胡', ()=>{
            const r = Majiang.rule({ '规则类型': '辽宁穷胡', '三门齐': true });
            const shoupai = Majiang.Shoupai.fromString('m123p456m789p22233');
            const hule = Majiang.Util.hule(shoupai, null, param({ rule: r }));
            assert.ok(! hule || ! hule.defen);
        });

        test('开启三门齐后三色可胡', ()=>{
            const r = Majiang.rule({ '规则类型': '辽宁穷胡', '三门齐': true });
            const shoupai = Majiang.Shoupai.fromString('m123p456s789z11122');
            const hule = Majiang.Util.hule(shoupai, null, param({ rule: r }));
            assert.ok(hule && hule.defen > 0);
        });

        test('默认不要求开门', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m123p456s789z11122');
            const hule = Majiang.Util.hule(shoupai, null, param());
            assert.ok(hule && hule.defen > 0);
        });

        test('开启必须开门后门清不能胡', ()=>{
            const r = Majiang.rule({ '规则类型': '辽宁穷胡', '必须开门': true });
            const shoupai = Majiang.Shoupai.fromString('m123p456s789z11122');
            const hule = Majiang.Util.hule(shoupai, null, param({ rule: r }));
            assert.ok(! hule || ! hule.defen);
        });

        test('开启必须开门后副露可胡', ()=>{
            const r = Majiang.rule({ '规则类型': '辽宁穷胡', '必须开门': true });
            const shoupai = Majiang.Shoupai.fromString('m123s789z11122,p4-56');
            const hule = Majiang.Util.hule(shoupai, null, param({ rule: r }));
            assert.ok(hule && hule.defen > 0);
        });
    });

    suite('Game.allow_hule', ()=>{
        test('断幺手 allow_hule 为 false', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m234p456s678m22');
            assert.ok(! Majiang.Game.allow_hule(
                rule, shoupai, 'm2+', 0, 1, false, true));
        });

        test('有幺九 allow_hule 为 true', ()=>{
            const shoupai = Majiang.Shoupai.fromString('m123p456s789z1112');
            assert.ok(Majiang.Game.allow_hule(
                rule, shoupai, 'z2+', 0, 1, false, true));
        });
    });
});
