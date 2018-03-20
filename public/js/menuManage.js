$(function(){


    var app1 = new Vue({
        el:"#content",
        data:{
            tableData:[{
                cdmc: '机票收费标准1',
                cddz: 'http://www.baidu.com',
                sjcd: 'java',
                bzxx:'这是一个测试1'
            }, {
                cdmc: '机票收费标准1',
                cddz: 'http://www.baidu.com',
                sjcd: 'java',
                bzxx:'这是一个测试1'
            }, {
                cdmc: '机票收费标准1',
                cddz: 'http://www.baidu.com',
                sjcd: 'java',
                bzxx:'这是一个测试1'
            }, {
                cdmc: '机票收费标准1',
                cddz: 'http://www.baidu.com',
                sjcd: 'java',
                bzxx:'这是一个测试1'
            }]
        },
        methods: {
            renderHeader:function(createElement, _self ) {
                return createElement(
                    'span',
                    ["操作",

                        createElement('a', {
                                'class': 'fa fa-plus-circle ml10 f18',
                                'href':'javascript:;',
                                on: { click: function () {
                                    alert(1)
                                } }
                            }
                        )
                    ]
                );
            }
        }
    });
    
    
    function format() {
        return "武汉"
    }
});