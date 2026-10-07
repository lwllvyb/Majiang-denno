/*!
 *  辽宁穷胡麻将 — 基于電脳麻将
 *
 *  Copyright(C) 2017 Satoshi Kobayashi (upstream)
 *  Released under the MIT license
 */
"use strict";

const { hide, show, fadeIn, scale,
        setSelector, clearSelector  } = Majiang.UI.Util;
const HintPanel = require('./hint');
const Advisor   = Majiang.AI.Advisor;

let loaded;

/** Default Liaoning rule (optional toggles OFF). */
function liaoning_rule() {
    const saved = JSON.parse(localStorage.getItem('Majiang.rule') || '{}');
    return Majiang.rule(Object.assign({
        '规则类型': '辽宁穷胡',
        '三门齐':   false,
        '必须开门': false,
        '有刻子':   false,
        '穷胡底分': 2,
    }, saved));
}

$(function(){

    let game;
    let human;
    let hint;
    const pai   = Majiang.UI.pai($('#loaddata'));
    const audio = Majiang.UI.audio($('#loaddata'));

    hint = new HintPanel($('#board'), pai);

    const analyzer = (kaiju)=>{
        $('body').addClass('analyzer');
        return new Majiang.UI.Analyzer($('#board > .analyzer'), kaiju, pai,
                                        ()=>$('body').removeClass('analyzer'));
    };
    const viewer = (paipu)=>{
        $('#board .controller').addClass('paipu')
        $('body').attr('class','board');
        scale($('#board'), $('#space'));
        const _viewer
                = new Majiang.UI.Paipu(
                        $('#board'), paipu, pai, audio, 'Majiang.pref',
                        ()=>fadeIn($('body').attr('class','file')),
                        analyzer);
        delete _viewer._view.dummy_name;
        return _viewer;
    };
    const stat = (paipu_list)=>{
        fadeIn($('body').attr('class','stat'));
        return new Majiang.UI.PaipuStat($('#stat'), paipu_list,
                        ()=>fadeIn($('body').attr('class','file')));
    };
    const file = new Majiang.UI.PaipuFile($('#file'), 'Majiang.game',
                                            viewer, stat);
    const rule = liaoning_rule();

    /** Wrap human player to refresh hints on each action. */
    function wrap_human(player) {
        const refresh = (msg)=>{
            try {
                let fulou;
                if (msg && msg.dapai && msg.dapai.l != player._menfeng) {
                    fulou = Advisor.advise_fulou(player, msg.dapai);
                }
                hint.attach(player);
                hint.refresh({ fulou });
            }
            catch (e) { console.warn('hint', e); }
        };
        const orig_action = player.action.bind(player);
        player.action = function(msg, callback) {
            const result = orig_action(msg, function(reply) {
                if (callback) callback(reply);
            });
            // wait a tick so model/shoupai is updated
            setTimeout(()=> refresh(msg), 50);
            return result;
        };
        // also refresh after zimo/dapai view updates
        ['action_zimo','action_dapai','action_fulou','action_gang'].forEach(name=>{
            if (typeof player[name] != 'function') return;
            const orig = player[name].bind(player);
            player[name] = function(...args) {
                const r = orig(...args);
                setTimeout(()=> refresh(args[0]), 80);
                return r;
            };
        });
        return player;
    }

    function start() {
        human = wrap_human(new Majiang.UI.Player($('#board'), pai, audio));
        let players = [ human ];
        for (let i = 1; i < 4; i++) {
            players[i] = new Majiang.AI();
        }
        game = new Majiang.Game(players, end, rule);
        game.view = new Majiang.UI.Board($('#board .board'),
                                        pai, audio, game.model);

        // Chinese dummy names for AI seats
        if (game.model) {
            game._view.dummy_name = ['自己', '下家·AI', '对家·AI', '上家·AI'];
        }

        $('#board .controller').removeClass('paipu')
        $('body').attr('class','board');
        scale($('#board'), $('#space'));

        new Majiang.UI.GameCtl($('#board'), 'Majiang.pref', game, game._view);
        hint.clear();
        hint.attach(human);
        game.kaiju();
    }

    function end(paipu) {
        if (paipu) file.add(paipu, 10);
        fadeIn($('body').attr('class','file'));
        file.redraw();
        hint.clear();
    }

    $('#file .start').on('click', start);

    $(window).on('resize', ()=>scale($('#board'), $('#space')));

    setTimeout(()=>{
        $(window).on('load', function(){
            if (! file.isEmpty) return end();
            hide($('#title .loading'));
            $('#title .start')
                .attr('tabindex', 0).attr('role','button')
                .on('click', ()=>{
                    clearSelector('title');
                    start();
                });
            show(setSelector($('#title .start'), 'title',
                            { focus: null, touch: false }));
        });
        if (loaded) $(window).trigger('load');
    }, 1000);
});

$(window).on('load', ()=> loaded = true);
