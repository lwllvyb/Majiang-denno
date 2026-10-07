const assert = require('assert');
const Majiang = require('@kobalab/majiang-core');
const Advisor = require('../lib/advisor');

suite('Advisor (辽宁建议)', ()=>{

    test('pai_label 使用简体称谓', ()=>{
        assert.equal(Advisor.pai_label('m1'), '一万');
        assert.equal(Advisor.pai_label('z5'), '白');
        assert.equal(Advisor.pai_label('z7'), '中');
    });

    test('is_yaojiu_or_zi', ()=>{
        assert.ok(Advisor.is_yaojiu_or_zi('m1'));
        assert.ok(Advisor.is_yaojiu_or_zi('z3'));
        assert.ok(! Advisor.is_yaojiu_or_zi('m5'));
    });

    test('advise 给出向听与推荐', ()=>{
        const rule = Majiang.rule({ '规则类型': '辽宁穷胡' });
        const player = new Majiang.Player();
        // Board model is created in Player constructor; seed via kaiju/qipai shape
        player._rule = rule;
        player._menfeng = 0;
        player._model = {
            zhuangfeng: 0,
            lunban: 0,
            shoupai: [],
            he: [ new Majiang.He(), new Majiang.He(),
                  new Majiang.He(), new Majiang.He() ],
            shan: { paishu: 40 },
        };
        const sp = Majiang.Shoupai.fromString('m123p456s789z1122z3');
        player._model.shoupai[0] = sp;

        const advice = Advisor.advise(player);
        assert.ok(advice.enabled);
        assert.ok(typeof advice.n_xiangting == 'number');
        assert.ok(advice.xiangting_text);
    });
});
