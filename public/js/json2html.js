// source: https://github.com/suskind/json2html-list

(function() {
  /**
   * Formats container element - can be overwritten in options
   * @param: container element (default: div)
   * @return: formatted container element
   */
  function formatContainer(container) {
    container.className = "container";
    return container;
  }
  /**
   * Formats UL element - can be overwritten in options
   * @param: UL element
   * @return: formatted LI element
   */
  function formatUl(ul) {
    ul.className = "ul-item";
    return ul;
  }

  /**
   * Formats LI element - can be overwritten in options
   * @param: LI element
   * @return: formatted LI element
   */
  function formatLi(li) {
    li.className = "li-item";
    return li;
  }

  /**
   * Formats object property text - can be overwritten in options
   * @param: text node object property
   * @return: strong element with property name inside
   */
  function formatProperty(prop) {
    var strong = document.createElement("strong");
    strong.appendChild(prop);
    return strong;
  }

  /**
   * Formats object/array value text - can be overwritten in options
   * @param: text node value
   * @return: span element with value text inside
   */
  function formatValue(val, prop) {
    var span = document.createElement("span");
    span.appendChild(val);
    return span;
  }

  /**
   * Options object
   */
  var _options = {
    container: "div",
    formatContainer: formatContainer,
    formatUl: formatUl,
    formatLi: formatLi,
    formatProperty: formatProperty,
    formatValue: formatValue
  };

  function JSON2HTMLList(json, options) {
    for (var opt in options) {
      if (options.hasOwnProperty(opt)) {
        _options[opt] = options[opt];
      }
    }

    var container = document.createElement(_options.container);
    container = _options.formatContainer(container);

    function walk(obj, parentElm) {
      if (typeof obj === "object" && obj !== null && obj.constructor === Object) {
        var ul = document.createElement("ul");
        ul = _options.formatUl(ul);
        var hasCount = 0;
        for (var prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            var li = document.createElement("li");
            li = _options.formatLi(li);
            ul.appendChild(li);

            if (typeof obj[prop] !== "object" || obj[prop] === null) {
              var propText = document.createTextNode(prop);
              propText = _options.formatProperty(propText);

              li.appendChild(propText);

              var valueText = document.createTextNode(obj[prop]);
              valueText = _options.formatValue(valueText, prop);

              li.appendChild(valueText);

              hasCount++;
            } else {
              var propText = document.createTextNode(prop);
              propText = _options.formatProperty(propText);

              li.appendChild(propText);

              walk(obj[prop], li);
            }
          }
        }
        parentElm.appendChild(ul);
      } else if (typeof obj === "object" && obj !== null && obj.constructor === Array) {
        var ul = document.createElement("ul");
        ul = _options.formatUl(ul);

        var hasCount = 0;
        for (var i = 0; i < obj.length; i++) {
          if (typeof obj[i] !== "object" || obj[i] === null) {
            var li = document.createElement("li");
            li = _options.formatLi(li);

            ul.appendChild(li);

            var valueText = document.createTextNode(obj[i]);
            valueText = _options.formatValue(valueText, i);

            li.appendChild(valueText);

            hasCount++;
          } else {
            walk(obj[i], parentElm);
          }
        }
        parentElm.appendChild(ul);
      }
    }

    walk(json, container);

    return container;
  }

  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = JSON2HTMLList;
  } else {
    if (!("JSON2HTMLList" in window)) {
      window.JSON2HTMLList = JSON2HTMLList;
    }
  }
})();
