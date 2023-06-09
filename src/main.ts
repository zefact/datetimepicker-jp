type Options = {
  pickDate: boolean;
  pickTime: boolean;
  startDate: any;
  endDate: any;
  viewMode: number;
  startViewMode: number;
  minViewMode: number;
  element?: HTMLElement;
  widget?: HTMLElement;
  weekStart: number;
  viewDate: any;
  isInput: boolean;
  workingHolidays?: Definition[];
};

import HolidaysJP from '@zefact/holidays-jp';
import moment from 'moment';
import { Definition } from '@zefact/holidays-jp/dist/type';
import { Definitions } from '@zefact/holidays-jp/dist/type';

export default class DateTimePicker {
  private options: Options = {
    pickDate: false,
    pickTime: true,
    startDate: '2000/1/1',
    endDate: '2100/12/31',
    viewMode: 0,
    startViewMode: 0,
    minViewMode: 0,
    element: undefined,
    widget: undefined,
    weekStart: 0,
    viewDate: new Date(),
    isInput: false,
  };

  private JpDates = {
    days: ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜'],
    daysShort: ['日', '月', '火', '水', '木', '金', '土', '日'],
    daysMin: ['日', '月', '火', '水', '木', '金', '土', '日'],
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  };

  private currentDate = new Date();

  constructor(selector: string, options?: Partial<Options>) {
    const elementNode = document.querySelector<HTMLElement>(selector);
    if (!elementNode) throw new Error(`"${selector}" not found.`);
    this.init(elementNode, options);
  }

  init(element: HTMLElement, options?: Partial<Options>) {
    Object.assign(this.options, options);
    if (!(this.options.pickDate || this.options.pickTime))
      throw new Error('少なくとも1つのピッカーを選択する必要があります。');
    this.options.element = element;
    this.options.widget = this.setTemplate();
    this.options.isInput = element instanceof HTMLInputElement;
    this.options.viewMode > 2 ? (this.options.viewMode = 0) : this.options.viewMode;
    this.options.startViewMode > 2 ? (this.options.startViewMode = 0) : this.options.startViewMode;
    this.options.minViewMode > 2 ? (this.options.minViewMode = 0) : this.options.minViewMode;
    this.options.weekStart > 6 ? (this.options.weekStart = 0) : this.options.weekStart;
    this.options.viewMode = this.options.startViewMode;
    if (this.options.workingHolidays) this.insertHolidays(this.options.workingHolidays);
    if (!(this.options.viewDate instanceof Date))
      this.options.viewDate = this.parseDateStringToDate(this.options.viewDate);
    if (!(this.options.startDate instanceof Date))
      this.options.startDate = this.parseDateStringToDate(this.options.startDate);
    if (!(this.options.endDate instanceof Date))
      this.options.endDate = this.parseDateStringToDate(this.options.endDate);
    this.fillDow();
    this.fillMonths();
    this.showMode();
    this._attachDatePickerEvents();
    this.fillDate();
    this.options.widget!.style.display = 'none';
  }

  // bodyにテンプレートを差し込む
  setTemplate() {
    const templateElement: HTMLElement = document.createElement('div');
    templateElement.className = 'bootstrap-datetimepicker-widget dropdown-menu';
    let DPtemplate: string = this.getDatePickerTemplate();
    let TPtemplate: string = this.getTimePickerTemplate();

    if (this.options.pickDate && this.options.pickTime) {
      templateElement.innerHTML =
        '<ul>' +
        '<li>' +
        '<div class="datepicker">' +
        DPtemplate +
        '</div>' +
        '</li>' +
        '<li class="picker-switch accordion-toggle"><a><i class=""></i></a></li>' +
        '<li>' +
        '<div class="timepicker">' +
        TPtemplate +
        '</div>' +
        '</li>' +
        '</ul>' +
        '</div>';
      document.body.append(templateElement);
      return templateElement;
    } else if (this.options.pickTime) {
      templateElement.innerHTML = '<div class="timepicker">' + TPtemplate + '</div>';
      document.body.append(templateElement);
      return templateElement;
    } else {
      templateElement.innerHTML = '<div class="datepicker">' + DPtemplate + '</div>';
      document.body.append(templateElement);
      return templateElement;
    }
  }

  getTimePickerTemplate() {
    let hourTemplate = '<span data-action="showHours" data-time-component="hours" class="timepicker-hour"></span>';

    let minuteTemplate =
      '<span data-action="showMinutes" data-time-component="minutes" class="timepicker-minute"></span>';

    let secondTemplate =
      '<span data-action="showSeconds" data-time-component="seconds" class="timepicker-second"></span>';

    let template =
      '<div class="timepicker-picker">' +
      '<table class="table-condensed">' +
      '<tr>' +
      '<td><a class="btn" data-action="incrementHours"></a></td>' +
      '<td class="separator"></td>' +
      '<td><a class="btn" data-action="incrementMinutes"></a></td>' +
      '<td class="separator"></td>' +
      '<td><a class="btn" data-action="incrementSeconds"></a></td>' +
      '</tr>' +
      '<tr>' +
      '<td>' +
      hourTemplate +
      '</td> ' +
      '<td class="separator">:</td>' +
      '<td>' +
      minuteTemplate +
      '</td> ' +
      '<td class="separator">:</td>' +
      '<td>' +
      secondTemplate +
      '</td> ' +
      '</tr>' +
      '<tr>' +
      '<td><a class="btn" data-action="decrementHours">&#9660;</a></td>' +
      '<td class="separator"></td>' +
      '<td><a class="btn" data-action="decrementMinutes">&#9660;</a></td>' +
      '<td class="separator"></td>' +
      '<td><a class="btn" data-action="decrementSeconds">&#9660;</a></td>' +
      '</table>' +
      '</div>' +
      '<div class="timepicker-hours" data-action="selectHour">' +
      '<table class="table-condensed">' +
      '</table>' +
      '</div>' +
      '<div class="timepicker-minutes" data-action="selectMinute">' +
      '<table class="table-condensed">' +
      '</table>' +
      '</div>' +
      '<div class="timepicker-seconds" data-action="selectSecond">' +
      '<table class="table-condensed">' +
      '</table>' +
      '</div>';

    return template;
  }

  getDatePickerTemplate() {
    let headTemplate =
      '<thead>' +
      '<tr>' +
      '<th class="prev">&lsaquo;</th>' +
      '<th colspan="5" class="switch"></th>' +
      '<th class="next">&rsaquo;</th>' +
      '</tr>' +
      '</thead>';

    let contentTemplate = '<tbody><tr><td colspan="7"></td></tr></tbody>';

    let template =
      '<div class="datepicker-days">' +
      '<table class="table-condensed">' +
      headTemplate +
      '<tbody></tbody>' +
      '</table>' +
      '</div>' +
      '<div class="datepicker-months">' +
      '<table class="table-condensed">' +
      headTemplate +
      contentTemplate +
      '</table>' +
      '</div>' +
      '<div class="datepicker-years">' +
      '<table class="table-condensed">' +
      headTemplate +
      contentTemplate +
      '</table>' +
      '</div>';

    return template;
  }

  // カレンダーを切り替える処理、0:日カレンダー, 1:月カレンダー, 2：年カレンダー
  showMode(dir?: number) {
    if (dir) {
      this.options.viewMode = Math.max(this.options.minViewMode!, Math.min(2, this.options.viewMode + dir));
    }
    if (this.options.widget) {
      let dpWidgets: NodeList = this.options.widget.querySelectorAll('.datepicker > div');
      let dpWidget: HTMLElement[] = Array.from(dpWidgets) as HTMLElement[];
      dpWidget.forEach((widget) => {
        widget.style.display = 'none';
      });

      switch (this.options.viewMode) {
        case 0:
          let days: HTMLElement | null = this.options.widget.querySelector('.datepicker-days');
          if (days) days.style.display = 'block';
          break;
        case 1:
          let month: HTMLElement | null = this.options.widget.querySelector('.datepicker-months');
          if (month) month.style.display = 'block';
          break;
        case 2:
          let year: HTMLElement | null = this.options.widget.querySelector('.datepicker-years');
          if (year) year.style.display = 'block';
          break;
      }
    }
  }

  // 加工関数
  getDaysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
  }

  formatDate(date: Date) {
    const yyyy = date.getFullYear();
    const mm = ('00' + (date.getMonth() + 1)).slice(-2);
    const dd = ('00' + date.getDate()).slice(-2);
    return `${yyyy}/${mm}/${dd}`;
  }

  parseDateStringToDate(dateString: string) {
    const momentDate = moment(dateString, ['YYYY-MM-DD', 'YYYY/MM/DD', 'YYYYMMDD']);
    if (momentDate.isValid()) {
      return momentDate.toDate();
    }
    throw new Error('オプションに設定された日付のフォーマットが正しくありません。');
  }

  private readonly _confirmFormatDate = new RegExp(`^[0-9]{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$`);

  // 日カレンダーのヘッダー、日曜～土曜を埋める処理
  fillDow() {
    let dowCnt: number = this.options.weekStart;
    let weekRow: HTMLElement = document.createElement('tr');
    while (dowCnt < this.options.weekStart + 7) {
      let weekHeader: HTMLElement = document.createElement('th');
      weekHeader.classList.add('dow');
      weekHeader.textContent = this.JpDates.daysMin[dowCnt % 7];
      weekRow.appendChild(weekHeader);
      dowCnt++;
    }
    this.options.widget?.querySelector('.datepicker-days thead')?.append(weekRow);
  }

  // 月カレンダーを埋める処理
  fillMonths() {
    for (let i = 0; i < 12; i++) {
      let html: HTMLElement = document.createElement('span');
      html.className = 'month';
      html.textContent = this.JpDates.monthsShort[i];
      this.options.widget?.querySelector('.datepicker-months td')?.append(html);
    }
  }

  // 月、年、モード切り替えの度に実行される、カレンダーを初期化して構築し直す
  fillDate() {
    if (this.options.pickDate) {
      let viewYear: number = this.options.viewDate.getFullYear();
      let viewMonth: number = this.options.viewDate.getMonth();
      let startYear: number = this.options.startDate.getFullYear();
      let startMonth: number = this.options.startDate.getMonth();
      let endYear: number = this.options.endDate.getFullYear();
      let endMonth: number = this.options.endDate.getMonth();

      // 全体のdisabledを削除して一旦初期化
      if (this.options.widget) {
        const disableElents = this.options.widget.querySelectorAll(
          '.datepicker-days .disabled, .datepicker-months .disabled, .datepicker-years .disabled'
        );
        disableElents.forEach((element) => {
          element.classList.remove('disabled');
        });

        this.options.widget.querySelector('.datepicker-days th:nth-child(2)')!.textContent =
          this.JpDates.months[viewMonth] + ' ' + viewYear;
      }

      // 現在のviewDateの日付を設定して前月の最終日に設定、カレンダーにどこまで前月を含むか決める
      let prevMonth: Date = new Date(viewYear, viewMonth - 1, 28);
      let daysInMonth: number = this.getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth() + 1);
      prevMonth.setDate(daysInMonth);
      prevMonth.setDate(daysInMonth - ((prevMonth.getDay() - this.options.weekStart + 7) % 7));
      if ((viewYear == startYear && viewMonth <= startMonth) || viewYear < startYear) {
        this.options.widget!.querySelector('.datepicker-days th:nth-child(1)')!.classList.add('disabled');
      }
      if ((viewYear == endYear && viewMonth >= endMonth) || viewYear > endYear) {
        this.options.widget?.querySelector('.datepicker-days th:nth-child(3)')?.classList.add('disabled');
      }
      let nextMonth: Date = new Date(prevMonth.valueOf());
      nextMonth.setDate(nextMonth.getDate() + 42);

      // 日付を入れる処理、１日づつ加算して判定
      let html: HTMLElement[] = [];
      let row: HTMLElement | null = null;
      let clsName: string;
      while (prevMonth.valueOf() < nextMonth.valueOf()) {
        if (prevMonth.getDay() === this.options.weekStart) {
          row = document.createElement('tr');
          html.push(row);
        }
        clsName = '';
        if (
          prevMonth.getFullYear() < viewYear ||
          (prevMonth.getFullYear() == viewYear && prevMonth.getMonth() < viewMonth)
        ) {
          clsName += ' old';
        } else if (
          prevMonth.getFullYear() > viewYear ||
          (prevMonth.getFullYear() == viewYear && prevMonth.getMonth() > viewMonth)
        ) {
          clsName += ' new';
        }
        if (prevMonth.valueOf() === this.currentDate.setHours(0, 0, 0, 0).valueOf()) {
          clsName += ' active';
        }
        if (prevMonth.valueOf() + 86400000 <= this.options.startDate.valueOf()) {
          clsName += ' disabled';
        }
        if (prevMonth.valueOf() > this.options.endDate.valueOf()) {
          clsName += ' disabled';
        }
        if (HolidaysJP.isHoliday(prevMonth)) {
          clsName += ' holiday';
        }
        if (prevMonth.toDateString() === new Date().toDateString()) {
          clsName += ' today';
        }

        let td = document.createElement('td');
        td.className = 'day' + clsName;
        td.textContent = prevMonth.getDate().toString();
        row?.append(td);
        prevMonth.setDate(prevMonth.getDate() + 1);
      }
      if (this.options.widget) {
        this.options.widget.querySelectorAll('.datepicker-days tbody').forEach((e) => {
          e.innerHTML = '';
          html.forEach((element) => {
            e.insertAdjacentElement('beforeend', element);
          });
        });
      }

      // 設定された期間外の矢印、月をdisabled
      let monthContent = this.options.widget?.querySelector('.datepicker-months');
      monthContent!.querySelector('th:nth-child(2)')!.innerHTML = viewYear.toString();
      monthContent!.querySelectorAll('span')!.forEach((e) => {
        e.classList.remove('active');
      });
      if (viewYear === startYear) {
        monthContent!.querySelectorAll(`span:nth-child(-n+${startMonth})`)!.forEach((e) => {
          e.classList.add('disabled');
        });
      }
      if (viewYear === endYear) {
        monthContent!.querySelectorAll(`span:nth-child(n+${endMonth + 2})`)!.forEach((e) => {
          e.classList.add('disabled');
        });
      }
      if (this.currentDate.getFullYear() === viewYear) {
        monthContent!.querySelector(`span:nth-child(${viewMonth + 1})`)!.classList.add('active');
      }

      if (viewYear - 1 < startYear) {
        monthContent!.querySelector('th:nth-child(1)')!.classList.add('disabled');
      }
      if (viewYear + 1 > endYear) {
        monthContent!.querySelector('th:nth-child(3)')!.classList.add('disabled');
      }

      // 年を入れる処理
      viewYear = Math.floor(viewYear / 10) * 10;
      let yearContent = this.options.widget?.querySelector('.datepicker-years');
      yearContent!.querySelector('td')!.innerHTML = '';
      yearContent!.querySelector('th:nth-child(2)')!.innerHTML = viewYear + '-' + (viewYear + 9);
      yearContent!.querySelector('th')!.classList.remove('disabled');
      if (startYear > viewYear) {
        yearContent!.querySelector('th:nth-child(1)')!.classList.add('disabled');
      }
      if (endYear < viewYear + 9) {
        yearContent!.querySelector('th:nth-child(3)')?.classList.add('disabled');
      }
      viewYear -= 1;
      for (let i = -1; i < 11; i++) {
        let yearElment: HTMLElement = document.createElement('span');
        if (i === -1 || i === 10) {
          yearElment.classList.add('old');
        }
        if (this.currentDate.getFullYear() === viewYear) {
          yearElment.classList.add('active');
        }
        if (viewYear < startYear || viewYear > endYear) {
          yearElment.classList.add('disabled');
        }
        yearElment.textContent = viewYear.toString();
        viewYear += 1;
        yearContent!.querySelector('td')!.append(yearElment);
      }
    }
  }

  insertHolidays(holidays: Definition[]) {
    const workingHolidays: Definitions = holidays;
    HolidaysJP.setWorkingDefinitions(workingHolidays);
  }

  // 日付がクリックされたらクリックされた日付を挿入、月・年表示の時は表示を変える
  insertDateIntoInput() {
    let insertValue = this.formatDate(this.currentDate);
    if (this.options.isInput) {
      let targetInput = this.options.element as HTMLInputElement;
      switch (this.options.minViewMode) {
        default:
          targetInput.value = insertValue;
          break;
        case 1:
          targetInput.value = insertValue.slice(0, 7);
          break;
        case 2:
          targetInput.value = insertValue.slice(0, 4);
          break;
      }
    }
  }

  // ウィジェット・エレメントでのイベントを別イベントにバインド
  _attachDatePickerEvents() {
    this.options.widget!.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.datepicker')) this.clickEvent.call(this, e);
    });
    this.options.widget!.addEventListener('mousedown', (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.datepicker')) this.stopEvent.call(this, e);
    });
    if (this.options.isInput) {
      this.options.element!.addEventListener('focus', this.focusEvent.bind(this));
      this.options.element!.addEventListener('focusout', this.focusoutEvent.bind(this));
      this.options.element!.addEventListener('change', this.changeEvent.bind(this));
    }
  }

  // ウィジェット内クリックイベント
  clickEvent(e: Event) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      let target = (e.target as HTMLElement).closest('span, td, th');
      if (target) {
        if (!target.classList.contains('disabled')) {
          switch (target.nodeName.toLowerCase()) {
            case 'th':
              switch (target.className) {
                case 'switch':
                  this.showMode(1);
                  break;
                case 'prev':
                  if (target.closest('.datepicker-days')) {
                    this.options.viewDate.setMonth(this.options.viewDate.getMonth() - 1);
                  }
                  if (target.closest('.datepicker-months')) {
                    this.options.viewDate.setFullYear(this.options.viewDate.getFullYear() - 1);
                  }
                  if (target.closest('.datepicker-years')) {
                    this.options.viewDate.setFullYear(this.options.viewDate.getFullYear() - 10);
                  }
                  this.fillDate();
                  break;
                case 'next':
                  if (target.closest('.datepicker-days')) {
                    this.options.viewDate.setMonth(this.options.viewDate.getMonth() + 1);
                  }
                  if (target.closest('.datepicker-months')) {
                    this.options.viewDate.setFullYear(this.options.viewDate.getFullYear() + 1);
                  }
                  if (target.closest('.datepicker-years')) {
                    this.options.viewDate.setFullYear(this.options.viewDate.getFullYear() + 10);
                  }
                  this.fillDate();
                  break;
              }
              break;
            case 'span':
              if (target.classList.contains('month')) {
                let month = Number(target.innerHTML.match(/\d+/g));
                this.options.viewDate.setMonth(month - 1);
              } else {
                let year = Number(target.innerHTML);
                this.options.viewDate.setFullYear(year);
              }
              if (this.options.viewMode !== 0) {
                this.currentDate = new Date(
                  this.options.viewDate.getFullYear(),
                  this.options.viewDate.getMonth(),
                  this.options.viewDate.getDate()
                );
              }
              this.insertDateIntoInput();
              this.showMode(-1);
              this.fillDate();
              break;
            case 'td':
              if (target.classList.contains('day')) {
                let day = Number(target.innerHTML);
                let month = this.options.viewDate.getMonth();
                let year = this.options.viewDate.getFullYear();
                if (target.classList.contains('old')) {
                  if (month === 0) {
                    month = 11;
                    year -= -1;
                  } else {
                    month -= 1;
                  }
                } else if (target.classList.contains('new')) {
                  if (month === 11) {
                    month = 0;
                    year += 1;
                  } else {
                    month += 1;
                  }
                }
                this.options.viewDate = new Date(year, month, Math.min(28, day));
                this.currentDate = new Date(year, month, day);
                this.fillDate();
                this.insertDateIntoInput();
              }
              break;
          }
        }
      }
    }
  }

  // 日付選択時にフォーカスがはずれないように
  stopEvent(e: Event) {
    e.stopPropagation();
    e.preventDefault();
  }

  focusEvent() {
    this.options.widget!.style.display = 'block';
    this.place();
  }

  focusoutEvent() {
    // this.options.widget!.style.display = 'none';
    // this.showMode(-10);
  }

  changeEvent() {
    let target = this.options.element! as HTMLInputElement;
    let targetVal = target.value;
    if (this._confirmFormatDate.test(targetVal)) {
      let year: number = Number(targetVal.slice(0, 4));
      let month: number = Number(targetVal.slice(5, 7));
      let day: number = Number(targetVal.slice(8, 10));
      let inputDate: Date = new Date(year, month - 1, day);
      if (
        inputDate.valueOf() < this.options.startDate.valueOf() ||
        inputDate.valueOf() > this.options.endDate.valueOf()
      ) {
        this.insertDateIntoInput();
        return;
      }
      this.currentDate = this.options.viewDate = inputDate;
      this.fillDate();
    } else {
      this.insertDateIntoInput();
    }
  }

  place() {
    // 初期値
    let position: string = 'absolute';
    let elementInfo = this.options.element!.getBoundingClientRect();
    let widgetInfo = this.options.widget!.getBoundingClientRect();
    let top = (elementInfo.bottom + 1).toString() + 'px';
    let left = elementInfo.left.toString() + 'px';
    this.options.widget!.style.position = position;
    this.options.widget!.style.top = top;
    this.options.widget!.style.left = left;

    // 画面の下端と被った場合エレメントの上に移動させる
    if (elementInfo.bottom + widgetInfo.height > window.innerHeight) {
      this.options.widget!.style.top = (elementInfo.top - widgetInfo.height - 1).toString() + 'px';
    }

    // 画面の右端と被った場合ウィジェットを右寄せに移動させる
    if (elementInfo.left + widgetInfo.width > window.innerWidth) {
      let rightOffset = elementInfo.left + widgetInfo.width - window.innerWidth;
      this.options.widget!.style.left = (elementInfo.left - rightOffset).toString() + 'px';
    }
  }
}
