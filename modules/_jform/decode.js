var decode = function() {
    "use strict";
    function decode(rootNode, delimiter, skipEmpty, nodeCallback, useIdIfEmptyName) {
        if (typeof skipEmpty == "undefined" || skipEmpty == null) skipEmpty = true;
        if (typeof delimiter == "undefined" || delimiter == null) delimiter = ".";
        if (arguments.length < 5) useIdIfEmptyName = false;
        rootNode = typeof rootNode == "string" ? document.getElementById(rootNode) : rootNode;
        var formValues = [], currNode, i = 0;
        if (rootNode.constructor == Array || typeof NodeList != "undefined" && rootNode.constructor == NodeList) {
            while (currNode = rootNode[i++]) {
                formValues = formValues.concat(getFormValues(currNode, nodeCallback, useIdIfEmptyName));
            }
        } else {
            formValues = getFormValues(rootNode, nodeCallback, useIdIfEmptyName);
        }
        return processNameValues(formValues, skipEmpty, delimiter);
    }
    function processNameValues(nameValues, skipEmpty, delimiter) {
        var result = {}, arrays = {}, i, j, k, l, value, nameParts, currResult, arrNameFull, arrName, arrIdx, namePart, name, _nameParts;
        for (i = 0; i < nameValues.length; i++) {
            value = nameValues[i].value;
            if (skipEmpty && (value === "" || value === null)) continue;
            name = nameValues[i].name;
            _nameParts = name.split(delimiter);
            nameParts = [];
            currResult = result;
            arrNameFull = "";
            for (j = 0; j < _nameParts.length; j++) {
                namePart = _nameParts[j].split("][");
                if (namePart.length > 1) {
                    for (k = 0; k < namePart.length; k++) {
                        if (k == 0) {
                            namePart[k] = namePart[k] + "]";
                        } else if (k == namePart.length - 1) {
                            namePart[k] = "[" + namePart[k];
                        } else {
                            namePart[k] = "[" + namePart[k] + "]";
                        }
                        arrIdx = namePart[k].match(/([a-z_]+)?\[([a-z_][a-z0-9_]+?)\]/i);
                        if (arrIdx) {
                            for (l = 1; l < arrIdx.length; l++) {
                                if (arrIdx[l]) nameParts.push(arrIdx[l]);
                            }
                        } else {
                            nameParts.push(namePart[k]);
                        }
                    }
                } else nameParts = nameParts.concat(namePart);
            }
            for (j = 0; j < nameParts.length; j++) {
                namePart = nameParts[j];
                if (namePart.indexOf("[]") > -1 && j == nameParts.length - 1) {
                    arrName = namePart.substr(0, namePart.indexOf("["));
                    arrNameFull += arrName;
                    if (!currResult[arrName]) currResult[arrName] = [];
                    currResult[arrName].push(value);
                } else if (namePart.indexOf("[") > -1) {
                    arrName = namePart.substr(0, namePart.indexOf("["));
                    arrIdx = namePart.replace(/(^([a-z_]+)?\[)|(\]$)/gi, "");
                    arrNameFull += "_" + arrName + "_" + arrIdx;
                    if (!arrays[arrNameFull]) arrays[arrNameFull] = {};
                    if (arrName != "" && !currResult[arrName]) currResult[arrName] = [];
                    if (j == nameParts.length - 1) {
                        if (arrName == "") {
                            currResult.push(value);
                            arrays[arrNameFull][arrIdx] = currResult[currResult.length - 1];
                        } else {
                            currResult[arrName].push(value);
                            arrays[arrNameFull][arrIdx] = currResult[arrName][currResult[arrName].length - 1];
                        }
                    } else {
                        if (!arrays[arrNameFull][arrIdx]) {
                            if (/^[a-z_]+\[?/i.test(nameParts[j + 1])) currResult[arrName].push({}); else currResult[arrName].push([]);
                            arrays[arrNameFull][arrIdx] = currResult[arrName][currResult[arrName].length - 1];
                        }
                    }
                    currResult = arrays[arrNameFull][arrIdx];
                } else {
                    arrNameFull += namePart;
                    if (j < nameParts.length - 1) {
                        if (!currResult[namePart]) currResult[namePart] = {};
                        currResult = currResult[namePart];
                    } else {
                        currResult[namePart] = value;
                    }
                }
            }
        }
        return result;
    }
    function getFormValues(rootNode, nodeCallback, useIdIfEmptyName) {
        var result = extractNodeValues(rootNode, nodeCallback, useIdIfEmptyName);
        return result.length > 0 ? result : getSubFormValues(rootNode, nodeCallback, useIdIfEmptyName);
    }
    function getSubFormValues(rootNode, nodeCallback, useIdIfEmptyName) {
        var result = [], currentNode = rootNode.firstChild;
        while (currentNode) {
            result = result.concat(extractNodeValues(currentNode, nodeCallback, useIdIfEmptyName));
            currentNode = currentNode.nextSibling;
        }
        return result;
    }
    function extractNodeValues(node, nodeCallback, useIdIfEmptyName) {
        var callbackResult, fieldValue, result, fieldName = getFieldName(node, useIdIfEmptyName);
        callbackResult = nodeCallback && nodeCallback(node);
        if (callbackResult && callbackResult.name) {
            result = [ callbackResult ];
        } else if (fieldName != "" && node.nodeName.match(/INPUT|TEXTAREA/i)) {
            fieldValue = getFieldValue(node);
            result = [ {
                name: fieldName,
                value: fieldValue
            } ];
        } else if (fieldName != "" && node.nodeName.match(/SELECT/i)) {
            fieldValue = getFieldValue(node);
            result = [ {
                name: fieldName.replace(/\[\]$/, ""),
                value: fieldValue
            } ];
        } else {
            result = getSubFormValues(node, nodeCallback, useIdIfEmptyName);
        }
        return result;
    }
    function getFieldName(node, useIdIfEmptyName) {
        if (node.name && node.name != "") return node.name; else if (useIdIfEmptyName && node.id && node.id != "") return node.id; else return "";
    }
    function getFieldValue(fieldNode) {
        if (fieldNode.disabled) return null;
        switch (fieldNode.nodeName) {
          case "INPUT":
          case "TEXTAREA":
            switch (fieldNode.type.toLowerCase()) {
              case "radio":
              case "checkbox":
                if (fieldNode.checked && fieldNode.value === "true") return true;
                if (!fieldNode.checked && fieldNode.value === "true") return false;
                if (fieldNode.checked) return fieldNode.value;
                break;

              case "button":
              case "reset":
              case "submit":
              case "image":
                return "";
                break;

              default:
                return fieldNode.value;
                break;
            }
            break;

          case "SELECT":
            return getSelectedOptionValue(fieldNode);
            break;

          default:
            break;
        }
        return null;
    }
    function getSelectedOptionValue(selectNode) {
        var multiple = selectNode.multiple, result = [], options, i, l;
        if (!multiple) return selectNode.value;
        for (options = selectNode.getElementsByTagName("option"), i = 0, l = options.length; i < l; i++) {
            if (options[i].selected) result.push(options[i].value);
        }
        return result;
    }
    return decode;

}();