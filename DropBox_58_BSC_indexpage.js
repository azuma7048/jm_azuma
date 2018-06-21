/*------------------------------------------------------------------------------------
【一覧画面時に実行されるスクリプト】
アプリ名：リフォーム・クリーニング進捗管理
アプリID：58

(1)ステータスの自動変更
(2)ステータスの色の自動変更
(3)請求月の入力制限
(4)発注「開始」「終了」の妥当性チェック
(5)フィールド内容の自動編集：チェックボックスを外すと値をNullにする
------------------------------------------------------------------------------------*/

(function() {
    "use strict";

//ロケールを初期化
    moment.locale('ja');


/*　---------------------------------------------------------------------------------
(1)ステータスの自動変更

------------------------------------------------------------------------------------*/


/*
//一覧画面（index.show)での処理


kintone.events.on(['app.record.index.show'], function(event) {
    for (var i = 0; i < record.length; i++) {
    var record = event.record[i];

    var date = moment();
    var now  = moment(date).format('YYYY-MM-DD');
    var vlOrder = record[i]['orderDate']['value'];
    var vlStart = record[i]['workStartDate']['value'];
    var vlEnd   = record[i]['workEndDate']['value'];


        record['progressStatus']['disabled'] = true;

        if ((!vlOrder) && (!vlStart) && (!vlEnd)) {
            record['progressStatus'].value = '未発注';

        }else if(((vlOrder) && (!vlStart)) || ((vlOrder) && ((vlStart) > (now)))) {
            record['progressStatus'].value = '発注済';

        }else if((vlOrder) && ((vlStart) <= (now)) && (!vlEnd)) {
            record['progressStatus'].value = '作業中';

        }else if (vlEnd) {
            record['progressStatus'].value = '作業完了';
        }
        return event;
    }
});
*/



var statusChangeIndex = [//'app.record.index.show',
                        'app.record.index.edit.show',
                        'app.record.index.edit.submit',
                        'app.record.index.edit.change.orderDate',
                        'app.record.index.edit.change.progressStatus',
                        'app.record.index.edit.change.workEndDate',
                        'app.record.index.edit.change.workStartDate'];

kintone.events.on(statusChangeIndex, function(event) {

    var record = event.record;
    var date = moment();
    var now  = moment(date).format('YYYY-MM-DD');

    var vlOrder = record['orderDate']['value'];
    var vlStart = record['workStartDate']['value'];
    var vlEnd   = record['workEndDate']['value'];

//以下はデバック用途
console.log("");
console.log(now);
console.log("【order】　" + vlOrder);
console.log("【Start】　" + vlStart);
console.log("【End】　" + vlEnd);


        record['progressStatus']['disabled'] = true;

        if ((!vlOrder) && (!vlStart) && (!vlEnd)) {
            record['progressStatus'].value = '未発注';

        }else if(((vlOrder) && (!vlStart)) || ((vlOrder) && ((vlStart) > (now)))) {
            record['progressStatus'].value = '発注済';

        }else if((vlOrder) && ((vlStart) <= (now)) && (!vlEnd)) {
            record['progressStatus'].value = '作業中';

        }else if (vlEnd) {
            record['progressStatus'].value = '作業完了';
        }
        return event;

});

/*-----------------------------------------------------------------------------------
(2)ステータスの色の自動変更
 レコードの一覧表示時にフィールド値の条件に応じて、文字色、フィールドの背景色を変更する
------------------------------------------------------------------------------------*/

kintone.events.on('app.record.index.show', function(event) {
    var bgColor = '#fff8dc';
    var elStatus = kintone.app.getFieldElements('progressStatus');

        for (var i = 0; i < elStatus.length; i++) {
            var record = event.records[i];

            switch (record['progressStatus']['value']) {
                case "未発注":
                    elStatus[i].style.color = '#ff0000';     //赤
                    break;
                case "発注済":
                    elStatus[i].style.color = '#009933';     //緑
                    break;
                case "作業中":
                    elStatus[i].style.color = '#0000ff';     //青
                    break;
                default:
                    elStatus[i].style.color = '#444444';
                    break;
            }
        }
        return event;
    });


/* -----------------------------------------------------------------------------------
(3)請求月の入力制限
   請求月（文字列フィールド）の入力規制をかける　→YYYY-MM
------------------------------------------------------------------------------------*/


    var billingFmtCheckIndex = ['app.record.index.edit.change.billingMonth',
                                'app.record.index.delete.submit',
                                'app.record.index.edit.submit'];

    kintone.events.on(billingFmtCheckIndex, function(event) {
        if(event.record.billingMonth.value === "" ) {
           }else if (!event.record.billingMonth.value.match(/^(20[0-9][0-9]-0[1-9]|20[0-9][0-9]-1[0-2])$/)) {
            event.record.billingMonth.error = 'フォーマットが正しくありません。\n(YYYY-MM)';
           }

    return event;

    });



/*-----------------------------------------------------------------------------------
(4)発注「開始」「終了」の妥当性チェック
発注日、作業開始日、作業終了日の関連チェック
https://developer.cybozu.io/hc/ja/articles/202341954-%E3%83%89%E3%83%AD%E3%83%83%E3%83%97%E3%83%80%E3%82%A6%E3%83%B3%E3%81%AE%E5%80%A4%E3%82%92%E5%A4%89%E6%9B%B4%E3%81%97%E3%81%A6%E5%88%A5%E3%83%95%E3%82%A3%E3%83%BC%E3%83%AB%E3%83%89%E3%81%AE%E5%80%A4%E3%82%92%E5%A4%89%E6%9B%B4%E3%81%97%E3%81%9F%E3%82%8A-%E7%84%A1%E5%8A%B9%E3%81%AB%E8%A8%AD%E5%AE%9A%E3%81%99%E3%82%8B
------------------------------------------------------------------------------------*/

    var workDateValidateCheckIndex = ['app.record.index.edit.change.orderDate',
                                      'app.record.index.edit.change.workStartDate',
                                      'app.record.index.edit.change.workEndDate',
                                      'app.record.index.edit.submit'];

    kintone.events.on(workDateValidateCheckIndex, function(event) {
        var record  = event.record;
        var date = moment();
        var now = moment(date).format('YYYY-MM-DD');
        var vlOrder = record['orderDate']['value'];
        var vlStart = record['workStartDate']['value'];
        var vlEnd   = record['workEndDate']['value'];

        // 発注日が空白で、開始日が空白でない場合
        if (!(vlOrder) && (vlStart)) {
           record['orderDate']['error'] = "発注日を入力してください。";

        // 開始日が空白で、終了日が空白でない場合
        } else if (!(vlStart) && (vlEnd)) {
            record['workStartDate']['error'] = "作業開始日を入力してください。";

        } else if ((vlStart) && (vlEnd)) {
            // 終了日が開始日より前に設定されている場合
            if (vlStart > vlEnd) {
                record['workEndDate']['error'] = "開始日よりあとに変更してください。";
            }
        }
        return event;
    });

/*-----------------------------------------------------------------------------------
(5)フィールド内容の自動編集：「発注内容」[workType]のチェックボックスを外すと値をNullにする

/* 回答の条件によって別フィールドの表示/非表示を切り替えるプログラム
https://developer.cybozu.io/hc/ja/articles/202377614-%E5%9B%9E%E7%AD%94%E3%81%AE%E6%9D%A1%E4%BB%B6%E3%81%AB%E3%82%88%E3%81%A3%E3%81%A6%E5%88%A5%E3%83%95%E3%82%A3%E3%83%BC%E3%83%AB%E3%83%89%E3%81%AE%E8%A1%A8%E7%A4%BA-%E9%9D%9E%E8%A1%A8%E7%A4%BA%E3%82%92%E5%88%87%E3%82%8A%E6%9B%BF%E3%81%88%E3%82%8B
---------------------------------------------------------------------------------------*/


//----------レコードの追加、編集、詳細画面で適用する-----------------------------
    var eventsIndex = ['app.record.index.edit.change.workType',
                  'app.record.index.edit.submit'];

    kintone.events.on(eventsIndex, function(event) {
        var record = event.record;

        //----------”チェック”（選択した場合）にフィールドを表示
        //----------チェックボックスを外すと、ラジオボタンやテキストフィールドの値を消去する
        var workType = record['workType']['value'];
        if (workType.indexOf('クリーニング') >= 0) {
            kintone.app.record.setFieldShown('cleanFloor', true);
            kintone.app.record.setFieldShown('cleanWall', true);
            kintone.app.record.setFieldShown('cleanCeiling', true);
        } else {
            kintone.app.record.setFieldShown('cleanFloor', false);
            kintone.app.record.setFieldShown('cleanWall', false);
            kintone.app.record.setFieldShown('cleanCeiling', false);
            event.record.cleanFloor['value'] = "なし";
            event.record.cleanWall['value'] = "なし";
            event.record.cleanCeiling['value'] = "なし";
        }

        if (workType.indexOf('リフォーム') >= 0) {
            kintone.app.record.setFieldShown('refrmFloor', true);
            kintone.app.record.setFieldShown('refrmWall', true);
            kintone.app.record.setFieldShown('refrmCeiling', true);
            kintone.app.record.setFieldShown('refrmFrame', true);
        } else {
            kintone.app.record.setFieldShown('refrmFloor', false);
            kintone.app.record.setFieldShown('refrmWall', false);
            kintone.app.record.setFieldShown('refrmCeiling', false);
            kintone.app.record.setFieldShown('refrmFrame', false);
            event.record.refrmFloor['value'] = "なし";
            event.record.refrmWall['value'] = "なし";
            event.record.refrmCeiling['value'] = "なし";
            event.record.refrmFrame['value'] = "なし";
        }

        if (workType.indexOf('設備') >= 0) {
            kintone.app.record.setFieldShown('workTypeFacility', true);
        } else {
            kintone.app.record.setFieldShown('workTypeFacility', false);
            event.record.workTypeFacility['value'] = ""
        }

        return event;

    });

})();