type Options = {
  pickDate: boolean;
  pickTime: boolean;
  showSeconds: boolean;
  minutesStep: number;
  secondsStep: number;
  viewMode: number;
  startViewMode: number;
  minViewMode: number;
  weekStart: number;
  isInput: boolean;
  minDate?: any;
  maxDate?: any;
  startTime?: any;
  element?: HTMLElement;
  widget?: HTMLElement;
  workingHolidays?: [string];
};

import moment, { Moment } from 'moment';
window.moment = moment;
import HolidaysJP from '@zefact/holidays-jp';
import { Definition } from '@zefact/holidays-jp/dist/type';

export default class DateTimePicker {
  private options: Options = {
    pickDate: true,
    pickTime: true,
    showSeconds: false,
    minutesStep: 1,
    secondsStep: 1,
    viewMode: 0,
    startViewMode: 0,
    minViewMode: 0,
    weekStart: 0,
    isInput: false,
  };

  private JpDates = {
    days: ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜'],
    daysShort: ['日', '月', '火', '水', '木', '金', '土', '日'],
    daysMin: ['日', '月', '火', '水', '木', '金', '土', '日'],
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  };

  private currentDate: Date = this.roundedTime(new Date());
  private viewDate: Date = this.roundedTime(new Date());

  constructor(element: HTMLElement, options?: Partial<Options>) {
    if (!element) throw new Error(`"${element}" not found.`);
    this.init(element, options);
  }

  init(element: HTMLElement, options?: Partial<Options>) {
    Object.assign(this.options, options);
    if (![1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60].includes(this.options.minutesStep || this.options.secondsStep)) {
      throw new Error('Cannot specify that value for minutesStep or secondsStep');
    }
    if (!(this.options.pickDate || this.options.pickTime)) throw new Error('You must select at least one picker.');
    this.options.element = element;
    this.options.widget = this.setTemplate();
    this.options.widget!.style.display = 'none';
    this.options.isInput = element instanceof HTMLInputElement;
    this.options.startViewMode > 2 ? (this.options.startViewMode = 0) : this.options.startViewMode;
    this.options.minViewMode > 2 ? (this.options.minViewMode = 0) : this.options.minViewMode;
    this.options.weekStart > 6 ? (this.options.weekStart = 0) : this.options.weekStart;
    this.options.viewMode = this.options.startViewMode;
    if (this.options.workingHolidays) this.addCustomHoliday(this.options.workingHolidays);
    if (typeof this.options.minDate === 'string' && this.options.minDate) {
      this.options.minDate = this.parseStringToDate(this.options.minDate);
    } else if (this.options.minDate instanceof moment && this.options.minDate) {
      this.options.minDate = (this.options.minDate as Moment).toDate();
    }
    if (typeof this.options.maxDate === 'string' && this.options.maxDate) {
      this.options.maxDate = this.parseStringToDate(this.options.maxDate);
    } else if (this.options.maxDate instanceof moment && this.options.maxDate) {
      this.options.maxDate = (this.options.maxDate as Moment).toDate();
    }
    if (typeof this.options.startTime === 'string' && this.options.pickTime) {
      this.parseStringToTime(this.options.startTime);
    }
    if (this.options.pickDate && this.options.pickTime) {
      this.fillDow();
      this.fillMonths();
      this.fillHours();
      this.fillMinutes();
      if (this.options.showSeconds) this.fillSeconds();
      this.fillDate();
      this.fillTime();
    } else if (this.options.pickDate) {
      this.fillDow();
      this.fillMonths();
      this.fillDate();
    } else {
      this.fillHours();
      this.fillMinutes();
      if (this.options.showSeconds) this.fillSeconds();
      this.fillTime();
    }
    this.showMode();
    this.checkPreviousDateTimeValue();
    this.attachPickerEvents();
    this.adjustPlace();
  }

  // DatePicker切り替え、0:DaysPicker 1:MonthPicker 2：YearPicker
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

  // TimePicker切り替え、0:TimePicker 1:HourPicker 2:MinutesPicker 3:SecondsPicker
  showTimePicker(mode: number) {
    let timePicker = this.options.widget!.querySelector('.timepicker-picker') as HTMLElement;
    let hourPicker = this.options.widget!.querySelector('.timepicker-hours') as HTMLElement;
    let minutesPicker = this.options.widget!.querySelector('.timepicker-minutes') as HTMLElement;
    let secondsPicker = this.options.widget!.querySelector('.timepicker-seconds') as HTMLElement;
    switch (mode) {
      case 0:
        timePicker.style.display = 'block';
        hourPicker.style.display = 'none';
        minutesPicker.style.display = 'none';
        if (this.options.showSeconds) secondsPicker.style.display = 'none';
        break;
      case 1:
        timePicker.style.display = 'none';
        hourPicker.style.display = 'block';
        break;
      case 2:
        timePicker.style.display = 'none';
        minutesPicker.style.display = 'block';
        break;
      case 3:
        timePicker.style.display = 'none';
        secondsPicker.style.display = 'block';
    }
  }

  getDaysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
  }

  formatDate(date: Date) {
    const yyyy = date.getFullYear();
    const mm = ('00' + (date.getMonth() + 1)).slice(-2);
    const dd = ('00' + date.getDate()).slice(-2);
    const HH = ('00' + date.getHours()).slice(-2);
    const MM = ('00' + date.getMinutes()).slice(-2);
    const SS = ('00' + date.getSeconds()).slice(-2);
    if (this.options.pickDate && this.options.pickTime && this.options.showSeconds) {
      return `${yyyy}/${mm}/${dd} ${HH}:${MM}:${SS}`;
    } else if (this.options.pickDate && this.options.pickTime) {
      return `${yyyy}/${mm}/${dd} ${HH}:${MM}`;
    } else if (this.options.pickDate) {
      return `${yyyy}/${mm}/${dd}`;
    } else if (this.options.pickTime && this.options.showSeconds) {
      return `${HH}:${MM}:${SS}`;
    } else {
      return `${HH}:${MM}`;
    }
  }

  createRegExp() {
    let minutes: string = '(';
    let seconds: string = '(';
    for (let i = 0; i <= 59; i += this.options.minutesStep) {
      minutes += i.toString().padStart(2, '0');
      if (i + this.options.minutesStep <= 59) {
        minutes += '|';
      }
    }
    for (let i = 0; i <= 59; i += this.options.secondsStep) {
      seconds += i.toString().padStart(2, '0');
      if (i + this.options.secondsStep <= 59) {
        seconds += '|';
      }
    }
    minutes += ')';
    seconds += ')';
    if (this.options.pickDate && this.options.pickTime && this.options.showSeconds) {
      return new RegExp(
        `^[0-9]{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\ ([01][0-9]|2[0-3]):${minutes}:${seconds}$`
      );
    } else if (this.options.pickDate && this.options.pickTime) {
      return new RegExp(`^[0-9]{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\ ([01][0-9]|2[0-3]):${minutes}$`);
    } else if (this.options.pickDate && this.options.minViewMode === 1) {
      return new RegExp('^[0-9]{4}/(0[1-9]|1[0-2])$');
    } else if (this.options.pickDate && this.options.minViewMode === 2) {
      return new RegExp('^[0-9]{4}$');
    } else if (this.options.pickTime && this.options.showSeconds) {
      return new RegExp(`^([01][0-9]|2[0-3]):${minutes}:${seconds}$`);
    } else if (this.options.pickDate) {
      return new RegExp('^[0-9]{4}/(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])$');
    } else {
      return new RegExp(`^([01][0-9]|2[0-3]):${minutes}$`);
    }
  }

  parseStringToDate(dateString: string) {
    const momentDate = moment(dateString, ['yyyy/MM/dd', 'yyyy-MM-dd', 'yyyyMMdd']);
    if (momentDate.isValid()) {
      return momentDate.toDate();
    } else {
      throw new Error('The date format set is incorrect.');
    }
  }

  parseStringToTime(timeString: string) {
    let momentTime: Moment;
    if (this.options.showSeconds) {
      momentTime = moment(timeString, 'HH:mm:ss');
    } else {
      momentTime = moment(timeString, 'HH:mm');
    }
    if (momentTime.isValid()) {
      this.currentDate.setHours(momentTime.toDate().getHours());
      this.currentDate.setMinutes(momentTime.toDate().getMinutes());
      this.currentDate.setSeconds(momentTime.toDate().getSeconds());
    } else {
      throw new Error('The time format set is incorrect.');
    }
  }

  // 日付以下切り捨て
  truncateDate(date: Date) {
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    return new Date(year, month, day);
  }

  // 秒・分数１桁台切り捨て
  roundedTime(date: Date) {
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    let hour = date.getHours();
    let minutes = 0;
    let seconds = 0;
    return new Date(year, month, day, hour, minutes, seconds);
  }

  // 日カレンダーのヘッダー、日曜～土曜を埋める処理
  fillDow() {
    let dowCnt: number = this.options.weekStart;
    let weekRow: HTMLElement = document.createElement('tr');
    while (dowCnt < this.options.weekStart + 7) {
      let weekHeader: HTMLElement = document.createElement('th');
      weekHeader.classList.add('dow');
      weekHeader.textContent = this.JpDates.daysMin[dowCnt % 7];
      if (weekHeader.textContent === '土') weekHeader.classList.add('saturday');
      if (weekHeader.textContent === '日') weekHeader.classList.add('sunday');
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
    let viewYear: number = this.viewDate.getFullYear();
    let viewMonth: number = this.viewDate.getMonth();
    let minYear: number = this.options.minDate ? this.options.minDate.getFullYear() : 0;
    let minMonth: number = this.options.minDate ? this.options.minDate.getMonth() : 0;
    let maxYear: number = this.options.maxDate ? this.options.maxDate.getFullYear() : Infinity;
    let maxMonth: number = this.options.maxDate ? this.options.maxDate.getMonth() : 11;

    // 全体のdisabledを削除して一旦初期化
    if (this.options.widget) {
      const disabledElements = this.options.widget.querySelectorAll(
        '.datepicker-days .disabled, .datepicker-months .disabled, .datepicker-years .disabled'
      );
      disabledElements.forEach((element) => {
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
    if ((viewYear == minYear && viewMonth <= minMonth) || viewYear < minYear) {
      this.options.widget!.querySelector('.datepicker-days th:nth-child(1)')!.classList.add('disabled');
    }
    if ((viewYear == maxYear && viewMonth >= maxMonth) || viewYear > maxYear) {
      this.options.widget?.querySelector('.datepicker-days th:nth-child(3)')?.classList.add('disabled');
    }
    let nextMonth: Date = new Date(prevMonth.valueOf());
    nextMonth.setDate(nextMonth.getDate() + 42);

    // 日付を入れてクラスを付ける
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
      }
      if (
        prevMonth.getFullYear() > viewYear ||
        (prevMonth.getFullYear() == viewYear && prevMonth.getMonth() > viewMonth)
      ) {
        clsName += ' new';
      }
      if (prevMonth.valueOf() === this.truncateDate(this.currentDate).valueOf()) {
        clsName += ' active';
      }
      if (this.options.minDate) {
        if (prevMonth.valueOf() + 86400000 <= this.options.minDate.valueOf()) {
          clsName += ' disabled';
        }
      }
      if (this.options.maxDate) {
        if (prevMonth.valueOf() > this.options.maxDate.valueOf()) {
          clsName += ' disabled';
        }
      }
      if (prevMonth.getDay() === 0) {
        clsName += ' sunday';
      }
      if (prevMonth.getDay() === 6) {
        clsName += ' saturday';
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
    if (viewYear === minYear) {
      monthContent!.querySelectorAll(`span:nth-child(-n+${minMonth})`)!.forEach((e) => {
        e.classList.add('disabled');
      });
    }
    if (viewYear === maxYear) {
      monthContent!.querySelectorAll(`span:nth-child(n+${maxMonth + 2})`)!.forEach((e) => {
        e.classList.add('disabled');
      });
    }
    if (this.currentDate.getFullYear() === viewYear) {
      monthContent!.querySelector(`span:nth-child(${viewMonth + 1})`)!.classList.add('active');
    }
    if (viewYear - 1 < minYear) {
      monthContent!.querySelector('th:nth-child(1)')!.classList.add('disabled');
    }
    if (viewYear + 1 > maxYear) {
      monthContent!.querySelector('th:nth-child(3)')!.classList.add('disabled');
    }

    // 年を入れる処理
    viewYear = Math.floor(viewYear / 10) * 10;
    let yearContent = this.options.widget?.querySelector('.datepicker-years');
    yearContent!.querySelector('td')!.innerHTML = '';
    yearContent!.querySelector('th:nth-child(2)')!.innerHTML = viewYear + '-' + (viewYear + 9);
    yearContent!.querySelector('th')!.classList.remove('disabled');
    if (minYear > viewYear) {
      yearContent!.querySelector('th:nth-child(1)')!.classList.add('disabled');
    }
    if (maxYear < viewYear + 9) {
      yearContent!.querySelector('th:nth-child(3)')?.classList.add('disabled');
    }
    viewYear -= 1;
    for (let i = -1; i < 11; i++) {
      let yearElment: HTMLElement = document.createElement('span');
      yearElment.classList.add('year');
      if (i === -1 || i === 10) {
        yearElment.classList.add('old');
      }
      if (this.currentDate.getFullYear() === viewYear) {
        yearElment.classList.add('active');
      }
      if (viewYear < minYear || viewYear > maxYear) {
        yearElment.classList.add('disabled');
      }
      yearElment.textContent = viewYear.toString();
      viewYear += 1;
      yearContent!.querySelector('td')!.append(yearElment);
    }
  }

  // 休日を追加する関数
  addCustomHoliday(holiday: [string]) {
    if (holiday instanceof Array) {
      let costomHolidays: Definition[] = [];
      holiday.forEach((e) => {
        if (typeof e[0] === 'string') {
          costomHolidays.push([9, 'holiday', [e]]);
        }
      });
      HolidaysJP.setWorkingDefinitions(costomHolidays);
    } else {
      throw new Error('The value passed to the workingHolidays should be an array');
    }
  }

  // 時間選択を埋める
  fillHours() {
    let table = this.options.widget?.querySelector('.timepicker .timepicker-hours table') as HTMLElement;
    table.parentElement!.style.display = 'none';
    let html = '';
    let current: number = 0;
    for (let i = 0; i < 6; i += 1) {
      html += '<tr>';
      for (let j = 0; j < 4; j += 1) {
        html += '<td class="hour">' + current.toString().padStart(2, '0') + '</td>';
        current++;
      }
      html += '</tr>';
    }
    table.innerHTML = html;
  }

  // 分選択を埋める
  fillMinutes() {
    let table = this.options.widget?.querySelector('.timepicker .timepicker-minutes table') as HTMLElement;
    table.parentElement!.style.display = 'none';
    let html = '';
    let current = 0;
    let column = 60 % (this.options.minutesStep * 4) === 0 ? 4 : 60 % (this.options.minutesStep * 5) === 0 ? 5 : 6;
    for (let i = 0; i < 60 / (this.options.minutesStep * column); i++) {
      html += '<tr>';
      for (let j = 0; j < column; j += 1) {
        if (current > 59) break;
        html += '<td class="minute">' + current.toString().padStart(2, '0') + '</td>';
        current += this.options.minutesStep;
      }
      html += '</tr>';
    }
    table.innerHTML = html;
  }

  // 秒選択を埋める
  fillSeconds() {
    let table = this.options.widget?.querySelector('.timepicker .timepicker-seconds table') as HTMLElement;
    table.parentElement!.style.display = 'none';
    table.innerHTML = '';
    let html = '';
    let current = 0;
    let column = 60 % (this.options.secondsStep * 4) === 0 ? 4 : 60 % (this.options.secondsStep * 5) === 0 ? 5 : 6;
    for (let i = 0; i < 60 / (this.options.secondsStep * column); i++) {
      html += '<tr>';
      for (let j = 0; j < column; j += 1) {
        if (current > 59) break;
        html += '<td class="second">' + current.toString().padStart(2, '0') + '</td>';
        current += this.options.secondsStep;
      }
      html += '</tr>';
    }
    table.innerHTML = html;
  }

  // timepickerに表示される時間を更新
  fillTime() {
    let timeComponents = this.options.widget!.querySelectorAll('.timepicker span[data-time-component]');
    let hour = this.currentDate.getHours().toString().padStart(2, '0');
    let minutes = this.currentDate.getMinutes().toString().padStart(2, '0');
    let seconds = this.currentDate.getSeconds().toString().padStart(2, '0');
    timeComponents.forEach((e) => {
      switch (e.getAttribute('data-time-component')) {
        case 'hours':
          e.textContent = hour;
          break;
        case 'minutes':
          e.textContent = minutes;
          break;
        case 'seconds':
          e.textContent = seconds;
          break;
      }
    });
  }

  // 日付がクリックされたらクリックされた日付をinputに挿入、月・年表示の時は表示を変える
  insertDateTimeIntoInput() {
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

  // インスタンス作成の時Inputに値が入っているか
  checkPreviousDateTimeValue() {
    if (this.options.isInput) {
      let inputTarget = this.options.element as HTMLInputElement;
      if (inputTarget.value) {
        let year = this.currentDate.getFullYear();
        let month = this.currentDate.getMonth();
        let day = this.currentDate.getDate();
        let hour = this.currentDate.getHours();
        let minutes = this.currentDate.getMinutes();
        let seconds = this.currentDate.getSeconds();
        if (this.options.pickDate && this.options.pickTime) {
          year = Number(inputTarget.value.slice(0, 4));
          month = Number(inputTarget.value.slice(5, 7));
          day = Number(inputTarget.value.slice(8, 10));
          hour = Number(inputTarget.value.slice(10, 13));
          minutes = Number(inputTarget.value.slice(14, 16));
          seconds = Number(inputTarget.value.slice(17, 19));
        } else if (this.options.pickTime) {
          hour = Number(inputTarget.value.slice(0, 2));
          minutes = Number(inputTarget.value.slice(3, 5));
          seconds = Number(inputTarget.value.slice(6, 8));
        } else if (this.options.minViewMode === 1) {
          year = Number(inputTarget.value.slice(0, 4));
          month = Number(inputTarget.value.slice(5, 7));
        } else if (this.options.minViewMode === 2) {
          year = Number(inputTarget.value.slice(0, 4));
        } else if (this.options.pickDate) {
          year = Number(inputTarget.value.slice(0, 4));
          month = Number(inputTarget.value.slice(5, 7));
          day = Number(inputTarget.value.slice(8, 10));
        }

        let inputValue = new Date(year, month - 1, day, hour, minutes, seconds);
        this.currentDate = new Date(inputValue);
        this.viewDate = new Date(inputValue);
        if (this.options.pickDate) this.fillDate();
        if (this.options.pickTime) this.fillTime();
      }
    }
  }

  // ウィジェット・エレメントでのイベントをバインド
  attachPickerEvents() {
    this.options.widget!.addEventListener('click', (e: Event) => {
      this.clickEvent.call(this, e);
    });
    this.options.widget!.addEventListener('mousedown', (e: Event) => {
      this.stopEvent.call(this, e);
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
                    this.viewDate.setMonth(this.viewDate.getMonth() - 1);
                  }
                  if (target.closest('.datepicker-months')) {
                    this.viewDate.setFullYear(this.viewDate.getFullYear() - 1);
                  }
                  if (target.closest('.datepicker-years')) {
                    this.viewDate.setFullYear(this.viewDate.getFullYear() - 10);
                  }
                  this.fillDate();
                  break;
                case 'next':
                  if (target.closest('.datepicker-days')) {
                    this.viewDate.setMonth(this.viewDate.getMonth() + 1);
                  }
                  if (target.closest('.datepicker-months')) {
                    this.viewDate.setFullYear(this.viewDate.getFullYear() + 1);
                  }
                  if (target.closest('.datepicker-years')) {
                    this.viewDate.setFullYear(this.viewDate.getFullYear() + 10);
                  }
                  this.fillDate();
                  break;
              }
              break;
            case 'span':
              if (target.classList.contains('month')) {
                let month = Number(target.innerHTML.match(/\d+/g));
                this.viewDate.setMonth(month - 1);
                this.currentDate.setMonth(month - 1);
                this.currentDate.setFullYear(this.viewDate.getFullYear());
              }
              if (target.classList.contains('year')) {
                let year = Number(target.innerHTML);
                this.viewDate.setFullYear(year);
                this.currentDate.setFullYear(year);
              }
              if (target.classList.contains('timepicker-hour')) {
                this.showTimePicker(1);
              }
              if (target.classList.contains('timepicker-minute')) {
                this.showTimePicker(2);
              }
              if (target.classList.contains('timepicker-second')) {
                this.showTimePicker(3);
              }
              if (this.options.pickDate) this.fillDate();
              this.insertDateTimeIntoInput();
              this.showMode(-1);
              break;
            case 'td':
              if (target.classList.contains('day')) {
                let day = Number(target.innerHTML);
                let month = this.viewDate.getMonth();
                let year = this.viewDate.getFullYear();
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
                this.viewDate = new Date(year, month, Math.min(28, day));
                this.currentDate = new Date(
                  year,
                  month,
                  day,
                  this.currentDate.getHours(),
                  this.currentDate.getMinutes(),
                  this.currentDate.getSeconds()
                );
              }
              if (target.classList.contains('hour')) {
                this.currentDate.setHours(Number(target.innerHTML));
                this.showTimePicker(0);
              } else if (target.classList.contains('minute')) {
                this.currentDate.setMinutes(Number(target.innerHTML));
                this.showTimePicker(0);
              } else if (target.classList.contains('second')) {
                this.currentDate.setSeconds(Number(target.innerHTML));
                this.showTimePicker(0);
              }

              // Timepickerの▲▼
              if (target.children.length !== 0) {
                let hour = this.currentDate.getHours();
                let minutes = this.currentDate.getMinutes();
                let seconds = this.currentDate.getSeconds();
                if (target.children[0].classList.contains('incrementHours')) {
                  hour += 1;
                } else if (target.children[0].classList.contains('incrementMinutes')) {
                  minutes += this.options.minutesStep;
                } else if (target.children[0].classList.contains('incrementSeconds')) {
                  if (seconds + this.options.secondsStep >= 60 && this.options.minutesStep !== 1) {
                    minutes += this.options.minutesStep - 1;
                    seconds += this.options.secondsStep;
                  } else {
                    seconds += this.options.secondsStep;
                  }
                } else if (target.children[0].classList.contains('decrementHours')) {
                  hour -= 1;
                } else if (target.children[0].classList.contains('decrementMinutes')) {
                  minutes -= this.options.minutesStep;
                } else if (target.children[0].classList.contains('decrementSeconds')) {
                  if (seconds - this.options.secondsStep < 0 && this.options.minutesStep !== 1) {
                    minutes -= this.options.minutesStep - 1;
                    seconds -= this.options.secondsStep;
                  } else {
                    seconds -= this.options.secondsStep;
                  }
                }
                if (this.options.minDate || this.options.maxDate) {
                  let resultDate = new Date(
                    this.currentDate.getFullYear(),
                    this.currentDate.getMonth(),
                    this.currentDate.getDate(),
                    hour,
                    minutes,
                    seconds
                  );
                  if (this.options.minDate && this.options.maxDate) {
                    if (
                      this.options.minDate.valueOf() > resultDate.valueOf() ||
                      this.options.maxDate.valueOf() < resultDate.valueOf()
                    ) {
                      return;
                    } else {
                      this.currentDate.setHours(hour);
                      this.currentDate.setMinutes(minutes);
                      this.currentDate.setSeconds(seconds);
                    }
                  } else if (this.options.minDate) {
                    if (this.options.minDate.valueOf() > resultDate.valueOf()) {
                      return;
                    } else {
                      this.currentDate.setHours(hour);
                      this.currentDate.setMinutes(minutes);
                      this.currentDate.setSeconds(seconds);
                    }
                  } else if (this.options.maxDate) {
                    if (this.options.maxDate.valueOf() < resultDate.valueOf()) {
                      return;
                    } else {
                      this.currentDate.setHours(hour);
                      this.currentDate.setMinutes(minutes);
                      this.currentDate.setSeconds(seconds);
                    }
                  }
                } else {
                  this.currentDate.setHours(hour);
                  this.currentDate.setMinutes(minutes);
                  this.currentDate.setSeconds(seconds);
                }
              }
              if (this.options.pickDate) this.fillDate();
              if (this.options.pickTime) this.fillTime();
              this.insertDateTimeIntoInput();
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
    this.adjustPlace();
    this.insertDateTimeIntoInput();
  }

  focusoutEvent() {
    this.options.widget!.style.display = 'none';
    this.showMode(-10);
    if (this.options.pickTime) this.showTimePicker(0);
  }

  changeEvent() {
    let target = this.options.element! as HTMLInputElement;
    let targetVal = target.value;
    // inputに入力された値が正規表現にマッチしなかった場合、選択されていた値に戻す
    if (this.createRegExp().test(targetVal)) {
      let year = this.currentDate.getFullYear();
      let month = this.currentDate.getMonth();
      let day = this.currentDate.getDate();
      let hour = this.currentDate.getHours();
      let minutes = this.currentDate.getMinutes();
      let seconds = this.currentDate.getSeconds();
      if (this.options.pickDate && this.options.pickTime) {
        year = Number(targetVal.slice(0, 4));
        month = Number(targetVal.slice(5, 7));
        day = Number(targetVal.slice(8, 10));
        hour = Number(targetVal.slice(10, 13));
        minutes = Number(targetVal.slice(14, 16));
        seconds = Number(targetVal.slice(17, 19));
      } else if (this.options.pickTime) {
        hour = Number(targetVal.slice(0, 2));
        minutes = Number(targetVal.slice(3, 5));
        seconds = Number(targetVal.slice(6, 8));
      } else if (this.options.minViewMode === 1) {
        year = Number(targetVal.slice(0, 4));
        month = Number(targetVal.slice(5, 7));
      } else if (this.options.minViewMode === 2) {
        year = Number(targetVal.slice(0, 4));
      } else if (this.options.pickDate) {
        year = Number(targetVal.slice(0, 4));
        month = Number(targetVal.slice(5, 7));
        day = Number(targetVal.slice(8, 10));
      }

      // 入力欄に入力された日付で更新、期間外の場合は選択されていた値に戻す
      let inputDate: Date = new Date(year, month - 1, day, hour, minutes, seconds);
      if (this.options.minDate) {
        if (inputDate.valueOf() < this.options.minDate.valueOf()) {
          this.insertDateTimeIntoInput();
          return;
        }
      }
      if (this.options.maxDate) {
        if (inputDate.valueOf() > this.options.maxDate.valueOf()) {
          this.insertDateTimeIntoInput();
          return;
        }
      }
      this.currentDate = new Date(inputDate);
      this.viewDate = new Date(inputDate);
      if (this.options.pickDate) this.fillDate();
      if (this.options.pickTime) this.fillTime();
      this.showMode(-10);
      if (this.options.pickTime) this.showTimePicker(0);
    } else {
      this.insertDateTimeIntoInput();
    }
  }

  adjustPlace() {
    // 初期値
    let position: string = 'absolute';
    let elementInfo = this.options.element!.getBoundingClientRect();
    let widgetInfo = this.options.widget!.getBoundingClientRect();
    let top = (elementInfo.bottom + 1).toString() + 'px';
    let left = elementInfo.left.toString() + 'px';
    this.options.widget!.style.position = position;
    this.options.widget!.style.top = top;
    this.options.widget!.style.left = left;

    // ウィンドウの下端と被る場合エレメントの上に移動させる
    if (elementInfo.bottom + widgetInfo.height > window.innerHeight) {
      this.options.widget!.style.top = (elementInfo.top - widgetInfo.height - 1).toString() + 'px';
    }

    // ウィンドウの右端と被る場合ウィジェットを右寄せに移動させる
    if (elementInfo.left + widgetInfo.width > window.innerWidth) {
      let rightOffset = elementInfo.left + widgetInfo.width - window.innerWidth;
      this.options.widget!.style.left = (elementInfo.left - rightOffset).toString() + 'px';
    }
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
        '<div class="timepicker">' +
        TPtemplate +
        '</div>' +
        '</li>' +
        '</ul>' +
        '</div>';
      document.body.append(templateElement);
      return templateElement;
    } else if (this.options.pickTime) {
      templateElement.innerHTML = '<div class="timepicker only">' + TPtemplate + '</div>';
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

    let minutesTemplate =
      '<span data-action="showMinutes" data-time-component="minutes" class="timepicker-minute"></span>';

    let secondsTemplate =
      '<span data-action="showSecondss" data-time-component="seconds" class="timepicker-second"></span>';

    let template = '';
    if (this.options.showSeconds) {
      template =
        '<div class="timepicker-picker">' +
        '<table class="table-condensed">' +
        '<tr>' +
        '<td><a class="time-control incrementHours">&#9650;</a></td>' +
        '<td class="separator"></td>' +
        '<td><a class="time-control incrementMinutes">&#9650;</a></td>' +
        '<td class="separator"></td>' +
        '<td><a class="time-control incrementSeconds">&#9650;</a></td>' +
        '</tr>' +
        '<tr>' +
        '<td>' +
        hourTemplate +
        '</td> ' +
        '<td class="separator">:</td>' +
        '<td>' +
        minutesTemplate +
        '</td> ' +
        '<td class="separator">:</td>' +
        '<td>' +
        secondsTemplate +
        '</td> ' +
        '</tr>' +
        '<tr>' +
        '<td><a class="time-control decrementHours">&#9660;</a></td>' +
        '<td class="separator"></td>' +
        '<td><a class="time-control decrementMinutes">&#9660;</a></td>' +
        '<td class="separator"></td>' +
        '<td><a class="time-control decrementSeconds">&#9660;</a></td>' +
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
    } else {
      template =
        '<div class="timepicker-picker">' +
        '<table class="table-condensed">' +
        '<tr>' +
        '<td><a class="time-control incrementHours">&#9650;</td>' +
        '<td class="separator"></td>' +
        '<td><a class="time-control incrementMinutes">&#9650;</a></td>' +
        '</tr>' +
        '<tr>' +
        '<td>' +
        hourTemplate +
        '</td> ' +
        '<td class="separator">:</td>' +
        '<td>' +
        minutesTemplate +
        '</td> ' +
        '</tr>' +
        '<tr>' +
        '<td><a class="time-control decrementHours">&#9660;</a></td>' +
        '<td class="separator"></td>' +
        '<td><a class="time-control decrementMinutes">&#9660;</a></td>' +
        '</table>' +
        '</div>' +
        '<div class="timepicker-hours" data-action="selectHour">' +
        '<table class="table-condensed">' +
        '</table>' +
        '</div>' +
        '<div class="timepicker-minutes" data-action="selectMinute">' +
        '<table class="table-condensed">' +
        '</table>' +
        '</div>';
    }
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

  // インスタンス作成後にオプションを変更する場合に使用
  setOptions(options?: Partial<Options>) {
    this.init(this.options.element!, options);
  }
}
