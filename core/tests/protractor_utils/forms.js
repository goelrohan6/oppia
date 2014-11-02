// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for interacting with forms when carrrying
 * out end-to-end testing with protractor.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var widgets = require('./widgets.js');
var objects = require('../../../extensions/objects/protractor.js');

var DictionaryEditor = function(elem) {
  return {
    editEntry: function(index, objectType) {
      var entry = elem.element(by.repeater('property in propertySchemas()').
        row(index));
      var editor = getEditor(objectType);
      return editor(entry);
    }
  };
};

var ListEditor = function(elem) {
  // NOTE: this returns a promise, not an integer.
  var _getLength = function() {
    return elem.all(by.repeater('item in localValue track by $index')).
        then(function(items) {
      return items.length;
    });
  };
  var getEntry = function(entryNum) {
    return elem.element(by.repeater('item in localValue track by $index').
      row(entryNum));
  };
  // Returns the new entry for further manipulation
  var addEntry = function() {
    var listLength = _getLength();
    elem.element(by.css('.protractor-test-add-list-entry')).click();
    return getEntry(listLength);
  };
  var deleteEntry = function(index) {
    elem.element(
      by.repeater('item in localValue track by $index').row(index)
    ).element(by.css('.protractor-test-delete-list-entry')).click();
  };

  return {
    editEntry: function(index, objectType) {
      var entry = elem.element(
        by.repeater('item in localValue track by $index'
      ).row(index));
      var editor = getEditor(objectType);
      return editor(entry);
    },
    addEntry: addEntry,
    deleteEntry: deleteEntry,
    getEntry: getEntry,
    // This will add or delete list elements as necessary
    setLength: function(desiredLength) {
      elem.all(by.repeater('item in localValue track by $index')).count().
          then(function(startingLength) {
        for (var i = startingLength; i < desiredLength; i++) {
          addEntry();
        }
        for (var i = desiredLength; i < startingLength; i++) {
          deleteEntry(i);
        }
    });
    }
  };
};

var RealEditor = function(elem) {
  return {
    setValue: function(value) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(value);
    }
  };
};

var RichTextEditor = function(elem) {
  var _appendContentText = function(text) {
    elem.element(by.tagName('rich-text-editor')).element(by.tagName('iframe')).
      sendKeys(text);
  };
  var _clickContentMenuButton = function(className) {
    elem.element(by.css('.wysiwyg')).element(by.css('.' + className)).click();
  };
  var _clearContent = function() {
    expect(elem.element(
      by.tagName('rich-text-editor')).element(by.tagName('iframe')).isPresent()
    ).toBe(true);
    browser.switchTo().frame(
      elem.element(by.tagName('rich-text-editor')).element(by.tagName('iframe')));
    // Angular is not present in this iframe, so we use browser.driver.
    browser.driver.findElement(by.tagName('body')).clear();
    browser.switchTo().defaultContent();
  };

  return {
    clear: function() {
      _clearContent();
    },
    setPlainText: function(text) {
      _clearContent();
      _appendContentText(text);
    },
    appendPlainText: function(text) {
      _appendContentText(text);
    },
    appendBoldText: function(text) {
      _clickContentMenuButton('bold');
      _appendContentText(text);
      _clickContentMenuButton('bold');
    },
    appendItalicText: function(text) {
      _clickContentMenuButton('italic');
      _appendContentText(text);
      _clickContentMenuButton('italic');
    },
    appendUnderlineText: function(text) {
      _clickContentMenuButton('underline');
      _appendContentText(text);
      _clickContentMenuButton('underline');
    },
    appendOrderedList: function(textArray) {
      _appendContentText('\n');
      _clickContentMenuButton('insertOrderedList');
      for (var i = 0; i < textArray.length; i++) {
        _appendContentText(textArray[i] + '\n');
      }
      _clickContentMenuButton('insertOrderedList');
    },
    appendUnorderedList: function(textArray) {
      _appendContentText('\n');
      _clickContentMenuButton('insertUnorderedList');
      for (var i = 0; i < textArray.length; i++) {
        _appendContentText(textArray[i] + '\n');
      }
      _clickContentMenuButton('insertUnorderedList');
    },
    appendHorizontalRule: function() {
      _clickContentMenuButton('insertHorizontalRule');
    },
    // Additional arguments may be sent to this function, and they will be
    // passed on to the relevant widget editor.
    addWidget: function(widgetName) {
      _clickContentMenuButton('custom-command-' + widgetName.toLowerCase());

      // The currently active modal is the last in the DOM
      var modal = element.all(by.css('.modal-dialog')).last();

      // Need to convert arguments to an actual array; we tell the widget
      // which modal to act on but drop the widgetName.
      var args = [modal];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      widgets.getNoninteractive(widgetName).customizeWidget.apply(null, args);
      modal.element(by.css('.protractor-test-close-widget-editor')).click();
      // TODO (Jacob) remove when issue 422 is fixed
      elem.element(by.tagName('rich-text-editor')).
        element(by.tagName('iframe')).click();
    },
    // Likewise, additional arguments can be sent
    addComplexWidget: function(widgetName) {
      _clickContentMenuButton('custom-command-' + widgetName.toLowerCase());
      var modal = element.all(by.css('.modal-dialog')).last();
      var args = [modal];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      widgets.getNoninteractive(widgetName).
        customizeComplexWidget.apply(null, args);
      modal.element(by.css('.protractor-test-close-widget-editor')).click();
      // TODO (Jacob) remove when issue 422 is fixed
      elem.element(by.tagName('rich-text-editor')).
        element(by.tagName('iframe')).click();
    },
  };
};

var UnicodeEditor = function(elem) {
  return {
    setText: function(text) {
      elem.element(by.tagName('input')).clear();
      elem.element(by.tagName('input')).sendKeys(text);
    }
  };
};

var editAutocompleteDropdown = function(elem) {
  return {
    setText: function(text) {
      elem.element(by.css('.select2-container')).click();
      // NOTE: the input field is top-level in the DOM rather than below the
      // container. The id is assigned when the dropdown is clicked.
      element(by.id('select2-drop')).element(by.css('.select2-input')).
        sendKeys(text + '\n');
    }
  };
};

// This must be sent the element immediately containing the various elements of
// the rich text content.
var expectRichText = function(elem) {
  var toMatch = function(callbackFunction) {
    // We remove all <span> elements since these are plain text that is 
    // sometimes represented just be text nodes.
    elem.all(by.xpath('./*[not(self::span)]')).map(function(entry) {
      return entry.getText(function(text) {
        return text;
      });
    }).then(function(arrayOfTexts) {
      // We re-derive the array of elements as we need it too
      elem.all(by.xpath('./*[not(self::span)]')).then(function(arrayOfElements) {
        elem.getText().then(function(fullText) {
          var checker = RichTextChecker(
            arrayOfElements, arrayOfTexts, fullText);
          callbackFunction(checker);
          checker.expectEnd();
        });
      });
    });
  };
  return {
    toMatch: toMatch,
    toEqual: function(text) {
      toMatch(function(checker) {
        checker.readPlainText(text);
      })
    }
  };
};

// The arrayOfElems should be the array of promises of top-level element nodes
// in the rich-text area. fullText should be a string consisting of all the 
// visible text in the rich text area (including both element and text nodes).
var RichTextChecker = function(arrayOfElems, arrayOfTexts, fullText) {
  // These are shared by the returned functions, and records how far through
  // the child elements and text of the rich text area checking has gone.
  var arrayPointer = 0;
  var textPointer = 0;
  // Widgets insert line breaks above and below themselves and these are
  // recorded in fullText but not arrayOfTexts so we need to track them 
  // specially.
  var justPassedWidget = false;

  return {
    readPlainText: function(text) {
      // Plain text is in a text node so not recorded in the array
      expect(
        fullText.substring(textPointer, textPointer + text.length)
      ).toEqual(text);
      textPointer = textPointer + text.length;
      justPassedWidget = false;
    },
    readBoldText: function(text) {
      expect(arrayOfElems[arrayPointer].getTagName()).toBe('b');
      expect(arrayOfElems[arrayPointer].getInnerHtml()).toBe(text);
      expect(arrayOfTexts[arrayPointer]).toEqual(text);
      arrayPointer = arrayPointer + 1;
      textPointer = textPointer + text.length;
      justPassedWidget = false;
    },
    readItalicText: function(text) {
      expect(arrayOfElems[arrayPointer].getTagName()).toBe('i');
      expect(arrayOfElems[arrayPointer].getInnerHtml()).toBe(text);
      expect(arrayOfTexts[arrayPointer]).toEqual(text);
      arrayPointer = arrayPointer + 1;
      textPointer = textPointer + text.length;
      justPassedWidget = false;
    },
    readUnderlineText: function(text) {
      expect(arrayOfElems[arrayPointer].getTagName()).toBe('u');
      expect(arrayOfElems[arrayPointer].getInnerHtml()).toBe(text);
      expect(arrayOfTexts[arrayPointer]).toEqual(text);
      arrayPointer = arrayPointer + 1;
      textPointer = textPointer + text.length;
      justPassedWidget = false;
    },
    // TODO (Jacob) add functions for other rich text components
    // Additional arguments may be sent to this function, and they will be
    // passed on to the relevant widget editor.
    readWidget: function(widgetName) {
      var elem = arrayOfElems[arrayPointer];
      expect(elem.getTagName()).
        toBe('oppia-noninteractive-' + widgetName.toLowerCase());
      expect(elem.getText()).toBe(arrayOfTexts[arrayPointer]);

      // Need to convert arguments to an actual array; we tell the widget
      // which element to act on but drop the widgetName.
      var args = [elem];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      widgets.getNoninteractive(widgetName).
        expectWidgetDetailsToMatch.apply(null, args);
      textPointer = textPointer + arrayOfTexts[arrayPointer].length + 
        (justPassedWidget ? 1 : 2);
      arrayPointer = arrayPointer + 1;
      justPassedWidget = true;
    },
    // Likewise additonal arguments can be sent.
    readComplexWidget: function(widgetName) {
      var elem = arrayOfElems[arrayPointer];
      expect(elem.getTagName()).
        toBe('oppia-noninteractive-' + widgetName.toLowerCase());
      expect(elem.getText()).toBe(arrayOfTexts[arrayPointer]);
      var args = [elem];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      widgets.getNoninteractive(widgetName).
        expectComplexWidgetDetailsToMatch.apply(null, args)
      textPointer = textPointer + arrayOfTexts[arrayPointer].length + 
        (justPassedWidget ? 1 : 2);
      arrayPointer = arrayPointer + 1;
      justPassedWidget = true;
    },
    expectEnd: function() {
      expect(arrayPointer).toBe(arrayOfElems.length);
    }
  }
};


// This is used by the list and dictionary editors to retreive the editors of
// their entries dynamically.
var FORM_EDITORS = {
  'Dictionary': DictionaryEditor,
  'List': ListEditor,
  'Real': RealEditor,
  'RichText': RichTextEditor,
  'Unicode': UnicodeEditor
};

var getEditor = function(formName) {
  if (FORM_EDITORS.hasOwnProperty(formName)) {
    return FORM_EDITORS[formName];
  } else if (objects.OBJECT_EDITORS.hasOwnProperty(formName)) {
    return objects.OBJECT_EDITORS[formName];
  } else {
    throw Error('Unknown form / object requested: ' + formName)
  }
};

exports.DictionaryEditor = DictionaryEditor;
exports.ListEditor = ListEditor;
exports.RealEditor = RealEditor;
exports.RichTextEditor = RichTextEditor;
exports.UnicodeEditor = UnicodeEditor;

exports.RichTextChecker = RichTextChecker;

exports.editAutocompleteDropdown = editAutocompleteDropdown;
exports.expectRichText = expectRichText;

exports.getEditor = getEditor;