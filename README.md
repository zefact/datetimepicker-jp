# datetimepicker-jp

日本のカレンダー及び時間を選択するウィジェットを表示する Javascript のライブラリです。
<br>オプションでカレンダーに任意の日付で祝日を追加することが可能です。

## インストール

```shell
$ npm install @zefact/datetimepicker-jp
```

## 利用方法

```ts
import Datetimepicker from '@zefact/datetimepicker-jp';
```

ブラウザ

```ts
const myPicker = new Datetimepicker('#my-picker'{
    // ここにオプションを指定する
    pickDate: true
})
```

## オプション

設定可能なオプションの一覧

| オプション名 | 型 | 初期 | 説明 |
| :------------ | :-----: | :---------: | ---- |
| pickDate | boolean | true | カレンダーを表示・非表示 |
| pickTime | boolean | true | Timepickerを表示・非表示 |
| showSeconds | boolean | false | Timepickerに秒数を含めるか |
| secondsStep | number  | 1 | 秒数の間隔、  [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60]から選択 |
| minutesStep | number  | 1 | 分数の間隔、  [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60]から選択 |
| startViewMode | number | 0 | カレンダーを年・月・日付のどこから始めるか。<br>0:日付表示  1:月表示  2:年表示 |
| minViewMode | number  | 0 | カレンダーをどこまで表示するか。<br>0:年・月・日付選択  1：年・月選択  3:年選択 |
| weekStart | number  | 0 | カレンダーの週の初めを何曜日にするか。<br>ここでは 0 を日曜日としています。 |
| minDate | moment<br>string<br>Date | なし | カレンダーを選択できる最小の日付。<br>Moment型・string型・Date型で渡せます。<br>string型のフォーマットは['yyyy/MM/dd', 'yyyy-MM-dd', 'yyyyMMdd']|
| maxDate | moment<br>string<br>Date | なし | カレンダーを選択できる最大の日付。設定方法は上記と同じです。|
| startTime | string | なし | Timepickerの初期表示時間。<br>設定がなければ、現在時:0分:0秒となります。<br>String型のフォーマットは['HH:mm:ss','HH:mm'] |
| workingHolidays | [string] | なし | カレンダーに任意の祝日を追加できます。<br>全体を配列として渡してください、フォーマットは['yyyy/MM/dd'] |
| setOptions | なし | インスタンス作成後にオプションを追加できます。 |

## Lisense

[MIT](LICENSE)

