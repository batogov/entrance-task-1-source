(function() {


    var now = new Date(2016, 10, 1);


    var scheduleElem = document.querySelector(".schedule");
    var schoolSelectElem = document.querySelector("#school");
    var teacherSelectElem = document.querySelector("#teacher");
    var sortSelectElem = document.querySelector("#date");


    // рендерим список преподавателей и лекции
    renderTeachers(teacherSelectElem);
    var filteredLessons = filterLessons(schoolSelectElem, teacherSelectElem, sortSelectElem);
    renderLessons(scheduleElem, filteredLessons);


    // вешаем обработчики на все селекты
    [schoolSelectElem, teacherSelectElem, sortSelectElem].forEach(function(selectElem) {
        selectElem.addEventListener("change", function(event) {
            event.preventDefault();
            var filteredLessons = filterLessons(schoolSelectElem, teacherSelectElem, sortSelectElem);
            renderLessons(scheduleElem, filteredLessons);
        });
    });





    /**
     * Функция фильтрует данные на основе активных фильтров.
     * @param schoolSelectElem {Element} Выпадающий список со школами.
     * @param teacherSelectElem {Element} Выпадающий список с преподавателями.
     * @param sortSelectElem {Element} Выпадающий список сортировки по дате.
     * @returns {Array} Массив отфильтрованных лекций.
     */
    function filterLessons(schoolSelectElem, teacherSelectElem, sortSelectElem) {
        var lessons = window.lessons;


        // фильтрация по школе
        var schoolValue = schoolSelectElem.value;

        if (schoolValue !== "all") {

            lessons = lessons.filter(function(lesson) {
                var flag = false;
                lesson.schools.forEach(function(school) {
                    if (school === schoolValue) {
                        flag = true;
                    }
                });
                return flag;
            });
        }


        // фильтрация по дате
        if (sortSelectElem.value === "up") {
            lessons = sortByDate(lessons);
        } else {
            lessons = sortByDate(lessons).reverse();
        }


        // сортировка по преподавателю
        var teacherValue = teacherSelectElem.value;

        if (teacherValue !== "all") {

            lessons = lessons.filter(function(lesson) {
                var flag = false;
                lesson.teachers.forEach(function(teacher) {
                    if (teacher === teacherValue) {
                        flag = true;
                    }
                });
                return flag;
            });
        }

        return lessons;
    }





    /**
     * Функция рендерит расписание на основе переданного массива лекций.
     * @param scheduleElem {Element} Элемент расписания на странице.
     * @param lessons {Array} Массив лекций.
     */
    function renderLessons(scheduleElem, lessons) {
        var lessonsElem = scheduleElem.querySelector(".schedule__lessons");
        var noResultsElem = scheduleElem.querySelector(".schedule__no-results");

        lessonsElem.innerHTML = "";

        if (lessons.length !== 0) {

            noResultsElem.classList.add("schedule__no-results--hidden");

            var fragment = document.createDocumentFragment();

            lessons.forEach(function (rawLessonData) {
                var lessonData = {};

                lessonData.datetime = formatDate(new Date(Date.parse(rawLessonData.datetime)));
                lessonData.name = rawLessonData.name;
                lessonData.hall = rawLessonData.hall;

                lessonData.schools = [];
                rawLessonData.schools.forEach(function(schoolName) {
                    lessonData.schools.push({
                        name: window.schools[schoolName]
                    });
                });

                lessonData.teachers = [];
                rawLessonData.teachers.forEach(function(teacherName) {
                    var teacher = window.teachers[teacherName];
                    teacher.imgFileName = teacherName;
                    lessonData.teachers.push(teacher);
                });

                // если лекция прошла
                if (new Date(Date.parse(rawLessonData.datetime)) < now) {
                    lessonData.materials = true;
                } else {
                    lessonData.time = true;
                }

                var lessonElement = getElementFromTemplate(lessonData);
                fragment.appendChild(lessonElement);
            });

            lessonsElem.appendChild(fragment);

            createPopupEvents();

        } else {
            noResultsElem.classList.remove("schedule__no-results--hidden");
        }
    }





    /**
     * Добавляет в выпадающий список всех преподавателей.
     * @param teacherSelectElem {Element} Элемент выпадающего списка с преподавателями.
     */
    function renderTeachers(teacherSelectElem) {
        var fragment = document.createDocumentFragment();

        var allOption = document.createElement("option");
        allOption.value = "all";
        allOption.innerHTML = "Все";
        fragment.appendChild(allOption);

        Object.keys(window.teachers).forEach(function(teacherName) {
            var currentOption = document.createElement("option");
            currentOption.value = teacherName;
            currentOption.innerHTML = window.teachers[teacherName].name;
            fragment.appendChild(currentOption);
        });

        teacherSelectElem.appendChild(fragment);
    }





    /**
     * Функция возвращает массив лекций, отсортированных по возрастанию даты.
     * @param lessons {Array} Массив лекций.
     * @returns {Array} Отсортированный массив лекций.
     */
    function sortByDate(lessons) {
        return lessons.sort(function(firstLesson, secondLesson) {
            var firstLessonDate = Date.parse(firstLesson.datetime);
            var secondLessonDate = Date.parse(secondLesson.datetime);

            return firstLessonDate - secondLessonDate;
        });
    }





    /**
     * Функция создаёт элемент на основе шаблона лекции и переданных данных.
     * @param data {Object} Объект, который описывает лекцию.
     * @returns {Element} Элемент, созданный по шаблону лекции.
     */
    function getElementFromTemplate(data) {
        var element = document.createElement('div');

        element.classList.add("lesson");
        if (data.materials) {
            element.classList.add("lesson--is-over");
        }

        element.innerHTML = Mustache.render(document.querySelector("#lesson-template").innerHTML, data);

        return element;
    }





    /**
     * Функция принимает на вход объект даты и возвращает его в "красивом" виде
     * для передачи в шаблон лекции.
     * @param date {Date} Объект даты.
     * @returns {string} Представление даты в виде строки.
     */
    function formatDate(date) {
        var monthToStrMap = {
            1: "января",
            2: "февраля",
            3: "марта",
            4: "апреля",
            5: "мая",
            6: "июня",
            7: "июля",
            8: "августа",
            9: "сентября",
            10: "октября",
            11: "ноября",
            12: "декабря"
        };

        var month = monthToStrMap[date.getUTCMonth()];
        var day = "" + date.getUTCDate();
        var hours = "" + date.getUTCHours();
        var minutes = "" + date.getUTCMinutes();

        if (minutes.length === 1) {
            minutes = minutes + "0";
        }

        return day + " " + month + ", " + hours + ":" + minutes;
    }





    /**
     * Функция создаёт события для всплывающих окон с информацией о преподавателях
     * и привязывает их к необходимым объектам на странице. Вызывается после того,
     * как выполнится очередной рендер расписания.
     */
    function createPopupEvents() {

        var teacherNameElems = document.querySelectorAll(".lesson__teacher-name");

        for (var i = 0; i < teacherNameElems.length; i++) {
            teacherNameElems[i].addEventListener("click", function(event) {
                var teacherPopupElem = this.nextElementSibling;
                teacherPopupElem.classList.toggle("teacher-popup--hidden");
            });
        }

        var underElems = document.querySelectorAll(".teacher-popup__under");

        for (var i = 0; i < underElems.length; i++) {
            underElems[i].addEventListener("click", function(event) {
                var teacherPopupElem = this.parentElement;
                teacherPopupElem.classList.toggle("teacher-popup--hidden");
            });
        }

        var closeElems = document.querySelectorAll(".teacher-popup__close");

        for (var i = 0; i < closeElems.length; i++) {
            closeElems[i].addEventListener("click", function(event) {
                var teacherPopupElem = this.parentElement.parentElement;
                teacherPopupElem.classList.toggle("teacher-popup--hidden");
            });
        }
    }


})();