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
const dateTimePicker = document.querySelector('.dateTimePicker');

const myPicker = new Datetimepicker(dateTimePicker {
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
| formatMode | number | 0 | inputに表示される文字列のフォーマット。<br>初期は0で['yyyy/MM/dd HH:mm:ss']です。<br>1を設定すると['yyyy年MM月dd日 HH時mm分ss秒']になります。
| workingHolidays | [string] | なし | カレンダーに任意の祝日を追加できます。<br>全体を配列として渡してください、フォーマットは['yyyy/MM/dd'] |

## メソッド

インスタンス作成後に使用できるメソッド

```ts
const picker = document.querySelectorAll('.datetimepicker');

const monthOption = {
  pickTime: false,
  startViewMode: 1,
  minViewMode: 1,
  formatMode: 1,
};

const timeOption = {
  pickDate: false,
  showSecond: false,
  minutesStep: 5,
};

picker.forEach((e) => {
  const myPicker = new Datetimepicker(e, {
    // 全カレンダー共通で使用したいオプションを設定
  });
  if (e.classList.contains('month')) {
    // インスタンス化後にsetOpitons()メソッドでオプションを変更・追加可
    myPicker.setOptions(monthOption);
  }

  if (e.classList.contains('date')) {
    myPicker.setOptions(dateOption);
  }
});
```

## Lisense

[MIT](LICENSE)

