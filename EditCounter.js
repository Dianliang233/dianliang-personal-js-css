var summaryLink = 'User:Powup333/editcounter.js|更新统计数据';
var tableCaption = '编辑统计';
var dateFormat = 'Y年Fj日 H:i:s';
var nameSpaces = new Array();
nameSpaces[0] = '主要';
nameSpaces[1] = '讨论页';
nameSpaces[2] = '用户页';
nameSpaces[3] = '用户讨论页';
nameSpaces[5] = 'Minecraft Wiki讨论页';
nameSpaces[6] = '文件';
nameSpaces[10] = '模板';
nameSpaces[11] = '模板讨论页';
nameSpaces[12] = '帮助';
nameSpaces[14] = '分类';
nameSpaces[828] = '模块';

/***********************************************************************************/
/*                                                                                 */
/*                           MEDIAWIKI EDITCOUNTER  v111                           */
/*                                                                                 */
/*     license:   CC-BY-SA 3.0  http://creativecommons.org/licenses/by-sa/3.0/     */
/*                                                                                 */
/* Original credit:                                                                */
/*   author:        Najzere @ strategywiki.org                                     */
/*   source:        http://strategywiki.org/wiki/User:Najzere/edit_counter.js      */
/*   documentation: http://strategywiki.org/wiki/User_talk:Najzere/edit_counter.js */
/*   contact:       http://strategywiki.org/wiki/User_talk:Najzere                 */
/* Minecraft Wiki credit:                                                          */
/*   author:        Matt (Majr) @ minecraft.gamepedia.com                          */
/*   source:        http://minecraft.gamepedia.com/User:Majr/editcounter.js        */
/* Current version credit:                                                         */
/*   author:        Kanegasi @ minecraft.gamepedia.com/en.wikipedia.org            */
/*   source:        http://en.wikipedia.org/wiki/User:Kanegasi/editcounter.js      */
/*   documentation: http://en.wikipedia.org/wiki/User:Kanegasi/editcounter         */
/*   contacts:      http://minecraft.gamepedia.com/User_talk:Kanegasi  -OR-        */
/*                  http://en.wikipedia.org/wiki/User_talk:Kanegasi                */
/***********************************************************************************/

$(document).ready(function () {
// Add new link labeled "统计数据" after "User contributions" in side menu
    if (wgTitle == wgUserName && wgNamespaceNumber == 2) {
        if (!$('#t-contributions').length) {
            alert('无法在侧边栏中找到“用户贡献”链接');
            return;
        }
    }
    var $editCountLink = $('<a>统计数据</a>').attr({
        id: 't-editcounter', href: '#', title: '对用户进行数据统计'
    });
    $('#t-contributions').after($('<li></li>').html($editCountLink));
    $('#t-editcounter').click(function () {
        $('#t-editcounter').text('正在处理..');
        setTimeout(function () {
// Set up variables
            if (/wikipedia.org/.test(mw.config.get('wgServer'))) {
                interwikiLink = 'en';
            } else {
                interwikiLink = 'wikipedia';
            }
            if (typeof (pageName) == 'undefined') {
                pageName = 'Edit count';
            }
            if (typeof (subPages) == 'undefined') {
                subPages = false;
            }
            if (typeof (datePageName) == 'undefined') {
                datePageName = 'date';
            }
            if (typeof (totalPageName) == 'undefined') {
                totalPageName = 'total';
            }
            if (typeof (summaryLink) == 'undefined') {
                summaryLink = '';
            }
            if (typeof (tableCaption) == 'undefined') {
                tableCaption = '';
            }
            if (typeof (tableHeaders) == 'undefined' || tableHeaders === true) {
                headerPipe = '! ';
            } else {
                headerPipe = '| ';
            }
            if (typeof (nameSpaces) == 'undefined') {
                nameSpaces = [];
            }
            if (typeof (mainTableAttrib) == 'undefined') {
                mainTableAttrib = 'class="wikitable" style="margin: ' +
                        '0 auto 1em; text-align: center"';
            }
            if (typeof (topRowAttrib) == 'undefined') {
                topRowAttrib = '';
            }
            if (typeof (bottomRowAttrib) == 'undefined') {
                bottomRowAttrib = '';
            }
            if (typeof (dateFormat) == 'undefined') {
                dateFormat = 'F j, Y';
            }
            if (typeof (noInclude1) == 'undefined') {
                noInclude1 = '';
            } else {
                noInclude1 = '<noinclude>' + noInclude1 + '</noinclude>';
            }
            if (typeof (noInclude2) == 'undefined') {
                noInclude2 = '';
            } else {
                noInclude2 = '<noinclude>' + noInclude2 + '</noinclude>';
            }
            if (typeof (noInclude3) == 'undefined') {
                noInclude3 = '';
            } else {
                noInclude3 = '<noinclude>' + noInclude3 + '</noinclude>';
            }
            if (typeof (noInclude) == 'undefined') {
                noInclude = '';
            } else {
                noInclude1 = '<noinclude>' + noInclude + '</noinclude>';
                noInclude2 = '<noinclude>' + noInclude + '</noinclude>';
                noInclude3 = '<noinclude>' + noInclude + '</noinclude>';
            }
            var userName = mw.config.get('wgUserName'),
                    contribLink = '[' + mw.config.get('wgServer') + mw.config.get('wgScriptPath') +
                    '/index.php?title=Special%3AContributions&target=' +
                    encodeURIComponent(userName) + '&namespace=',
                    bracesLeft = '{{',
                    bracesRight = '}}',
                    deletedEdits = 0,
                    edits = [],
                    editToken,
                    fullPageName = 'User:' + userName + '/' + pageName,
                    fullDatePageName = fullPageName + '/' + datePageName,
                    fullTotalPageName = fullPageName + '/' + totalPageName,
                    commonPage = 'User:' + userName + '/' + 'common.js',
                    vectorPage = 'User:' + userName + '/' + 'vector.js',
                    scriptPages = commonPage + '|' + vectorPage,
                    next,
                    noCaptcha = false,
                    oldPage = false,
                    oldPage1 = true,
                    oldPage2 = true,
                    oldPage3 = true,
                    tableAll,
                    timeStamp = bracesLeft + 'subst:#time:' + dateFormat + bracesRight,
                    tablePart1 = '{| ' + mainTableAttrib + '\n',
                    tablePart2 = '|+ style="caption-side: bottom; ' +
                    'font-size: x-small; font-weight: normal" | ',
                    tablePart3 = '数据截止至：' + timeStamp + '\n',
                    tablePart5 = '|- ' + topRowAttrib + '\n',
                    tablePart6 = '',
                    tablePart7 = '|- class="plainlinks" ' + bottomRowAttrib + '\n',
                    tablePart8 = '',
                    totalCount,
                    totalEdits = bracesLeft + 'subst:formatnum:',
                    touchedDate,
                    currentDate,
                    coolDown,
                    touchedDate2,
                    currentDate2,
                    coolDown2,
                    ajaxvars;
            if (tableCaption !== '') {
                tablePart4 = '|-\n! colspan=99 style="align: center; ' +
                        'border-left: hidden; border-right: hidden; ' +
                        'border-top: hidden" | ' + tableCaption + '\n';
            } else {
                tablePart4 = '';
            }
// Retrieve edit token and check for existing page(s)
            $.ajax({
                type: "GET",
                url: mw.util.wikiScript('api'),
                data: {
                    format: 'json',
                    action: 'query',
                    prop: 'info',
                    intoken: 'edit',
                    titles: fullPageName + '|' + fullDatePageName +
                            '|' + fullTotalPageName + '|' + scriptPages
                },
                dataType: 'json',
                async: false,
                success: function (propResponse) {
                    for (var page in propResponse.query.pages) {
                        editToken = propResponse.query.pages[page].edittoken;
                        if (propResponse.query.pages[page].title == fullPageName) {
                            if (propResponse.query.pages[page].missing) {
                                oldPage1 = false;
                            } else {
                                oldPage = true;
                            }
                            if (propResponse.query.pages[page].touched) {
                                touchedDate = propResponse.query.pages[page].touched;
                                currentDate = propResponse.query.pages[page].starttimestamp;
                                coolDown = new Date(currentDate.substr(0, 10).replace(/-/ig, ',')) -
                                        new Date(touchedDate.substr(0, 10).replace(/-/ig, ','));
                            }
                        }
                        if (propResponse.query.pages[page].title == vectorPage) {
                            if (!propResponse.query.pages[page].missing) {
                                if (propResponse.query.pages[page].touched) {
                                    touchedDate2 = propResponse.query.pages[page].touched;
                                    currentDate2 = propResponse.query.pages[page].starttimestamp;
                                    coolDown2 = new Date(currentDate2.substr(0, 10).replace(/-/ig, ',')) -
                                            new Date(touchedDate2.substr(0, 10).replace(/-/ig, ','));
                                }
                            }
                        }
                        if (propResponse.query.pages[page].title == commonPage) {
                            if (!propResponse.query.pages[page].missing && !coolDown2) {
                                if (propResponse.query.pages[page].touched) {
                                    touchedDate2 = propResponse.query.pages[page].touched;
                                    currentDate2 = propResponse.query.pages[page].starttimestamp;
                                    coolDown2 = new Date(currentDate2.substr(0, 10).replace(/-/ig, ',')) -
                                            new Date(touchedDate2.substr(0, 10).replace(/-/ig, ','));
                                }
                            }
                        }
                        if (propResponse.query.pages[page].title == fullDatePageName) {
                            if (propResponse.query.pages[page].missing && subPages) {
                                oldPage2 = false;
                            } else {
                                oldPage = true;
                            }
                        }
                        if (propResponse.query.pages[page].title == fullTotalPageName) {
                            if (propResponse.query.pages[page].missing && subPages) {
                                oldPage3 = false;
                            } else {
                                oldPage = true;
                            }
                        }
                    }
                },
                error: function (xhr, textStatus, error) {
                    $('#t-editcounter').text('失败！');
                    alert(xhr.statusText);
                    alert(textStatus);
                    alert(error);
                    return;
                }
            });
// Check if user autoconfirmed and stop script if false and no page exists.
// Also check for last count and stop if same day.
            if (/confirmed/i.test(mw.config.get('wgUserGroups'))) {
                noCaptcha = true;
            }
            if (!oldPage && !noCaptcha) {
                $('#t-editcounter').text('失败！');
                if (!oldPage1) {
                    oldPage1 = '\n\t' + fullPageName;
                } else {
                    oldPage1 = '';
                }
                if (!oldPage2 && subPages) {
                    oldPage2 = '\n\t' + fullDatePageName;
                } else {
                    oldPage2 = '';
                }
                if (!oldPage3 && subPages) {
                    oldPage3 = '\n\t' + fullTotalPageName;
                } else {
                    oldPage3 = '';
                }
                alert('Your account requires a captcha to make new pages.\n' +
                        'Make sure the following page(s) exist:\n' +
                        oldPage1 + oldPage2 + oldPage3);
                return;
            }
// Initialize namespace and edit arrays
            $.ajax({
                type: "GET",
                url: mw.util.wikiScript('api'),
                data: {
                    format: 'json',
                    action: 'query',
                    meta: 'siteinfo',
                    siprop: 'namespaces'
                },
                dataType: 'json',
                async: false,
                success: function (siResponse) {
                    for (var ns in siResponse.query.namespaces) {
                        if (siResponse.query.namespaces[ns].id > -1) {
                            if (siResponse.query.namespaces[ns].id === 0 &&
                                    typeof (nameSpaces[0]) == 'undefined') {
                                nameSpaces[siResponse.query.namespaces[ns].id] = '主要';
                            } else if (siResponse.query.namespaces[ns].id == 4 &&
                                    typeof (nameSpaces[4]) == 'undefined') {
                                nameSpaces[siResponse.query.namespaces[ns].id] = mw.config.get('wgSiteName');
                            } else if (siResponse.query.namespaces[ns].id == 5 &&
                                    typeof (nameSpaces[5]) == 'undefined') {
                                nameSpaces[siResponse.query.namespaces[ns].id] = mw.config.get('wgSiteName') +
                                        '讨论页';
                            } else {
                                if (typeof (nameSpaces[siResponse.query.namespaces[ns].id]) == 'undefined') {
                                    nameSpaces[siResponse.query.namespaces[ns].id] =
                                            siResponse.query.namespaces[ns].canonical;
                                }
                            }
                            edits[siResponse.query.namespaces[ns].id] = 0;
                        }
                    }
                },
                error: function (xhr, textStatus, error) {
                    $('#t-editcounter').text('失败！');
                    alert(xhr.statusText);
                    alert(textStatus);
                    alert(error);
                    return;
                }
            });
// Fill edit array with moves (negative numbers)
            next = '1';
            while (next != 'stop') {
                ajaxvars = {
                    type: "GET",
                    url: mw.util.wikiScript('api'),
                    data: {
                        format: 'json',
                        action: 'query',
                        rawcontinue: '',
                        list: 'logevents',
                        leuser: userName,
                        letype: 'move',
                        leprop: 'title',
                        lelimit: 'max',
                        ledir: 'newer'
                    },
                    dataType: 'json',
                    async: false,
                    success: function (logResponse) {
                        for (var event in logResponse.query.logevents) {
                            edits[logResponse.query.logevents[event].ns] -= 1;
                            deletedEdits -= 1;
                        }
                        if (logResponse['query-continue']) {
                            next = logResponse['query-continue'].logevents.lecontinue;
                        } else {
                            next = 'stop';
                        }
                    },
                    error: function (xhr, textStatus, error) {
                        $('#t-editcounter').text('失败！');
                        alert(xhr.statusText);
                        alert(textStatus);
                        alert(error);
                        return;
                    }
                };
                if (next != '1') {
                    ajaxvars.data = {
                        format: 'json',
                        action: 'query',
                        rawcontinue: '',
                        list: 'logevents',
                        leuser: userName,
                        letype: 'move',
                        leprop: 'title',
                        lelimit: 'max',
                        ledir: 'newer',
                        lecontinue: next
                    };
                }
                $.ajax(ajaxvars);
            }
// Fill edit array with protects (negative numbers)
            next = '1';
            while (next != 'stop') {
                ajaxvars = {
                    type: "GET",
                    url: mw.util.wikiScript('api'),
                    data: {
                        format: 'json',
                        action: 'query',
                        rawcontinue: '',
                        list: 'logevents',
                        leuser: userName,
                        letype: 'protect',
                        leprop: 'title',
                        lelimit: 'max',
                        ledir: 'newer'
                    },
                    dataType: 'json',
                    async: false,
                    success: function (logResponse) {
                        for (var event in logResponse.query.logevents) {
                            edits[logResponse.query.logevents[event].ns] -= 1;
                            deletedEdits -= 1;
                        }
                        if (logResponse['query-continue']) {
                            next = logResponse['query-continue'].logevents.lecontinue;
                        } else {
                            next = 'stop';
                        }
                    },
                    error: function (xhr, textStatus, error) {
                        $('#t-editcounter').text('失败！');
                        alert(xhr.statusText);
                        alert(textStatus);
                        alert(error);
                        return;
                    }
                };
                if (next != '1') {
                    ajaxvars.data = {
                        format: 'json',
                        action: 'query',
                        rawcontinue: '',
                        list: 'logevents',
                        leuser: userName,
                        letype: 'protect',
                        leprop: 'title',
                        lelimit: 'max',
                        ledir: 'newer',
                        lecontinue: next
                    };
                }
                $.ajax(ajaxvars);
            }
// Fill edit array with file overwrites (negative numbers)
            next = '1';
            while (next != 'stop') {
                ajaxvars = {
                    type: "GET",
                    url: mw.util.wikiScript('api'),
                    data: {
                        format: 'json',
                        action: 'query',
                        rawcontinue: '',
                        list: 'logevents',
                        leuser: userName,
                        leaction: 'upload/overwrite',
                        leprop: 'title',
                        lelimit: 'max',
                        ledir: 'newer'
                    },
                    dataType: 'json',
                    async: false,
                    success: function (logResponse) {
                        for (var event in logResponse.query.logevents) {
                            edits[logResponse.query.logevents[event].ns] -= 1;
                            deletedEdits -= 1;
                        }
                        if (logResponse['query-continue']) {
                            next = logResponse['query-continue'].logevents.lecontinue;
                        } else {
                            next = 'stop';
                        }
                    },
                    error: function (xhr, textStatus, error) {
                        $('#t-editcounter').text('失败！');
                        alert(xhr.statusText);
                        alert(textStatus);
                        alert(error);
                        return;
                    }
                };
                if (next != '1') {
                    ajaxvars.data = {
                        format: 'json',
                        action: 'query',
                        list: 'logevents',
                        rawcontinue: '',
                        leuser: userName,
                        leaction: 'upload/overwrite',
                        leprop: 'title',
                        lelimit: 'max',
                        ledir: 'newer',
                        lecontinue: next
                    };
                }
                $.ajax(ajaxvars);
            }
// Fill edit array with normal edits (positive numbers)
            next = '1';
            while (next != 'stop') {
                ajaxvars = {
                    type: "GET",
                    url: mw.util.wikiScript('api'),
                    data: {
                        format: 'json',
                        action: 'query',
                        rawcontinue: '',
                        list: 'usercontribs',
                        ucuser: userName,
                        ucprop: 'title',
                        uclimit: 'max',
                        ucdir: 'newer'
                    },
                    dataType: 'json',
                    async: false,
                    success: function (ucResponse) {
                        for (var event in ucResponse.query.usercontribs) {
                            edits[ucResponse.query.usercontribs[event].ns] += 1;
                            deletedEdits += 1;
                        }
                        if (ucResponse['query-continue']) {
                            next = ucResponse['query-continue'].usercontribs.uccontinue;
                        } else {
                            next = 'stop';
                        }
                    },
                    error: function (xhr, textStatus, error) {
                        $('#t-editcounter').text('失败！');
                        alert(xhr.statusText);
                        alert(textStatus);
                        alert(error);
                        return;
                    }
                };
                if (next != '1') {
                    ajaxvars.data = {
                        format: 'json',
                        action: 'query',
                        rawcontinue: '',
                        list: 'usercontribs',
                        ucuser: userName,
                        ucprop: 'title',
                        uclimit: 'max',
                        ucdir: 'newer',
                        uccontinue: next
                    };
                }
                $.ajax(ajaxvars);
            }
            for (var i = 0; i < nameSpaces.length; i++) {
                if (edits[i] > 0) {
                    if (i == 2) {
                        if (subPages) {
                            edits[i] += 3;
                        } else {
                            edits[i] += 1;
                        }
                    }
                    tablePart6 += headerPipe + nameSpaces[i] + '\n';
                    tablePart8 += '| ' + contribLink + i + ' ' + bracesLeft +
                            'subst:formatnum:' + edits[i] + bracesRight + ']' + '\n';
                }
            }
            tablePart6 += headerPipe + '总计\n';
            tablePart8 += '| [[Special:Contributions/' +
                    userName + '|<span title="已删除的编辑：';
// Retrieve total edit count and calculate estimated deleted edits
            $.ajax({
                type: "GET",
                url: mw.util.wikiScript('api'),
                data: {
                    format: 'json',
                    action: 'query',
                    meta: 'userinfo',
                    uiprop: 'editcount'
                },
                dataType: 'json',
                async: false,
                success: function (totalResponse) {
                    deletedEdits -= totalResponse.query.userinfo.editcount;
                    if (subPages) {
                        totalCount = totalResponse.query.userinfo.editcount + 3;
                    } else {
                        totalCount = totalResponse.query.userinfo.editcount + 1;
                    }
                    tablePart8 += Math.abs(deletedEdits) + '">' + totalEdits +
                            totalCount + bracesRight + '</span>]]\n|}';
                },
                error: function (xhr, textStatus, error) {
                    $('#t-editcounter').text('失败！');
                    alert(xhr.statusText);
                    alert(textStatus);
                    alert(error);
                    return;
                }
            });
            tableAll = tablePart1 + tablePart2 + tablePart3 + tablePart4 +
                    tablePart5 + tablePart6 + tablePart7 + tablePart8;
// Submit post request to main page
            $.ajax({
                type: 'POST',
                url: mw.util.wikiScript('api'),
                data: {
                    format: 'json',
                    action: 'edit',
                    title: fullPageName,
                    text: tableAll + noInclude1,
                    summary: '[[' + summaryLink + ']]',
                    bot: '1',
                    minor: '1',
                    recreate: '1',
                    token: editToken
                },
                dataType: 'json',
                async: false,
                success: function () {
                    $('#t-editcounter').text('成功！');
                },
                error: function (xhr, textStatus, error) {
                    $('#t-editcounter').text('失败！');
                    alert(xhr.statusText);
                    alert(textStatus);
                    alert(error);
                    return;
                }
            });
// Submit post request to date page
            if (subPages) {
                $.ajax({
                    type: 'POST',
                    url: mw.util.wikiScript('api'),
                    data: {
                        format: 'json',
                        action: 'edit',
                        title: fullDatePageName,
                        text: timeStamp + noInclude2,
                        summary: '[[' + summaryLink + ']]',
                        bot: '1',
                        minor: '1',
                        recreate: '1',
                        token: editToken
                    },
                    dataType: 'json',
                    async: false,
                    success: function () {
                        $('#t-editcounter').text('成功！');
                    },
                    error: function (xhr, textStatus, error) {
                        $('#t-editcounter').text('失败！');
                        alert(xhr.statusText);
                        alert(textStatus);
                        alert(error);
                        return;
                    }
                });
            }
// Submit post request to total page
            if (subPages) {
                $.ajax({
                    type: 'POST',
                    url: mw.util.wikiScript('api'),
                    data: {
                        format: 'json',
                        action: 'edit',
                        title: fullTotalPageName,
                        text: totalCount + noInclude3,
                        summary: '[[' + summaryLink + ']]',
                        bot: '1',
                        minor: '1',
                        recreate: '1',
                        token: editToken
                    },
                    dataType: 'json',
                    async: false,
                    success: function () {
                        $('#t-editcounter').text('成功！');
                    },
                    error: function (xhr, textStatus, error) {
                        $('#t-editcounter').text('失败！');
                        alert(xhr.statusText);
                        alert(textStatus);
                        alert(error);
                        return;
                    }
                });
            }
        }, 1000);
    });
});