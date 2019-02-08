(function () {

    'use strict';

    var rootSearchFilter;
    var locationSearch = {};

    function tryParse(q, Search, $log) {
        try {
            return Search.parse(q);
        } catch (e) {
            $log.debug("parsing failure", e);
            return false;
        }
    }

    function queryIsNotEmpty(res) {
        return res && res.length >= 1 && res[0] && res[0].type !== 'WHITE_SPACE';
    }

    function parseAndBroadcastForBoardSearch(query, $log, $rootScope, Search) {

        var r = tryParse(query, Search, $log);

        var locSearch = {};
        var searchFilterRes = undefined;
        if (queryIsNotEmpty(r)) {
            locSearch = {q: query};
            searchFilterRes = r;
        }

        rootSearchFilter = searchFilterRes;
        locationSearch = locSearch;

        if (r !== false || (r === false && query === "")) {
            $rootScope.$broadcast('refreshSearch', {searchFilter: searchFilterRes, location: locSearch});
        }

    }

    function fromTagsToQuery(tags) {

        if (!angular.isArray(tags)) {
            return '';
        }

        var res = '';

        angular.forEach(tags, function (v) {
            res += v.value + ' ';
        });

        return res.trim();
    }

    function fromQueryToTags(query) {

        var res = [];

        angular.forEach(query, function (v) {
            var r = {};
            if (v.type !== 'FREETEXT') {
                r = {value: (v.type === 'USER_LABEL' ? '#' : '') + v.name + (v.value ? (':' + (v.value.originalValue || v.value.value)) : '')};
            } else {
                r = {value: v.value.value};
            }
            res.push(r);
        });

        return res;
    }

    function quoteIfHasSpace(str) {
        if (str.indexOf(' ') > -1 && str[0] !== '\'' && str.slice(-1) !== '\'') {
            return "'" + str + "'";
        } else {
            return str;
        }
    }

    angular.module('lavagna.components').component('lvgSearchInput', {
            bindings: {
                project: '=',
                board: '='
            },
            templateUrl: 'app/components/search-input/search-input.html',
            controllerAs: 'lvgSearchInput',
            controller: function ($scope, $log, $location, $rootScope, $timeout, $http, Search) {

            	var ctrl = this;

            	function toParams(input, prefix) {
                    var q = input.substr(prefix.length).trim();
                    var params = {term: q};
                    if (ctrl.project !== undefined) {
                        params.projectName = ctrl.project.shortName
                    }
                    return params;
                }

                function searchUser(input, prefix, data) {
                    return $http.get('api/search/user', {params: toParams(input, prefix)}).then(function (res) {
                        for (var i = 0; i < res.data.length; i++) {
                            var u = res.data[i];
                            data.push({
                                value: prefix + u.provider + ":" + u.username + " ",
                                text: prefix + u.provider + ":" + u.username,
                                type: "create",
                                user: u,
                                prefix: prefix
                            });
                        }
                        return data
                    });
                }

                function searchMilestone(input, prefix, data) {
                    return $http.get('api/search/milestone', {params: toParams(input, prefix)}).then(function (res) {
                        for (var i = 0; i < res.data.length; i++) {
                            var u = res.data[i];
                            data.push({
                                value: prefix + quoteIfHasSpace(u),
                                text: prefix + quoteIfHasSpace(u),
                                type: "create"
                            });
                        }
                        return data;
                    });
                }

                function searchLabel(input, prefix, data) {
                    return $http.get('api/search/labels', {params: toParams(input, prefix)}).then(function (res) {
                        for (var i = 0; i < res.data.length; i++) {
                            var u = res.data[i];
                            var text = prefix + quoteIfHasSpace(u.name);
                            var type = "create";
<<<<<<< HEAD
                            console.log(u.type);
                            if (u.type === 'LIST') {
                                text += ':';
                                type = "example";
                            }
=======
                            /*if (u.type !== 'NULL') { FIXME
                                text += ':';
                                type = "example";
                            }*/
>>>>>>> 0abf1efd
                            data.push({value: text, text: text, type: type});
                        }
                        return data;
                    });
                }

                function searchLabelValues(input, data) {
                    return $http.get('api/search/label-values', {params: toParams(input.substring(0, input.length - 1), '#')}).then(function (res) {
                        for (var i = 0; i < res.data.length; i++) {
                            var u = res.data[i];
                            data.push({
                                value: input + quoteIfHasSpace(u),
                                text: input + quoteIfHasSpace(u),
                                type: "create"
                            });
                        }
                        return data;
                    });
                }

                ctrl.toSearch = {};
                
                function autocompleteProvider(input) {

                    var inputIsEmpty = input === null || input === undefined || input.trim() === '';

                    //
                    if (inputIsEmpty) {
                        return false;
                    }
                    //

                    input = input.trim();

                    var examples = [{value: "#", text: "#<label>[:<value>]", type: "example"},
                        {value: "to:", text: "to:<user/me/unassigned>", type: "example"},
                        {value: "by:", text: "by:<user/me>", type: "example"},
                        {value: "created:", text: "created:<date>", type: "example"},
                        {value: "watched:", text: "watched:<user/me/unassigned>", type: "example"},
                        {value: "updated:", text: "updated:<date>", type: "example"},
                        {value: "updated_by:", text: "updated_by:<user/me>", type: "example"},
                        {value: "milestone:", text: "milestone:<value>", type: "example"},
                        {value: "status:", text: "status:<status>", type: "example"},
                        {value: "due:", text: "due:<date>", type: "example"},
                        {value: "location:", text: "location:<location> (all/project level)", type: "example"}];

                    var res = [{value: input, text: 'Add criteria ' + input}];

                    angular.forEach(examples, function (v) {
                        if (v.value.indexOf(input) > -1) {
                            res.push(v);
                        }
                    });

                    if (input.indexOf("to:") === 0) {
                        res.push({value: "to:me ", text: "to:me", type: "create"});
                        res.push({value: "to:unassigned ", text: "to:unassigned", type: "create"});
                        return searchUser(input, "to:", res);
                    } else if (input.indexOf("by:") === 0) {
                        res.push({value: "by:me ", text: "by:me", type: "create"});
                        return searchUser(input, "by:", res);
                    } else if (input.indexOf("watched:") === 0) {
                        res.push({value: "watched:me ", text: "watched:me", type: "create"});
                        res.push({value: "watched:unassigned ", text: "watched:unassigned", type: "create"});
                        return searchUser(input, "watched:", res);
                    } else if (input.indexOf("updated:") === 0) {
                        res.push({value: "updated:late ", text: "updated:late", type: "create"});
                        res.push({value: "updated:today ", text: "updated:today", type: "create"});
                        res.push({value: "updated:yesterday ", text: "updated:yesterday", type: "create"});
                        res.push({value: "updated:this week ", text: "updated:this week", type: "create"});
                        res.push({value: "updated:this month ", text: "updated:this month", type: "create"});
                        res.push({value: "updated:previous week ", text: "updated:previous week", type: "create"});
                        res.push({
                            value: "updated:previous month ",
                            text: "updated:previous month",
                            type: "create"
                        });
<<<<<<< HEAD

                        if (input.indexOf("to:") === 0) {
                            res.push({value: "to:me ", text: "to:me", type: "create"});
                            res.push({value: "to:unassigned ", text: "to:unassigned", type: "create"});
                            return searchUser(input, "to:", res);
                        } else if (input.indexOf("by:") === 0) {
                            res.push({value: "by:me ", text: "by:me", type: "create"});
                            return searchUser(input, "by:", res);
                        } else if (input.indexOf("watched:") === 0) {
                            res.push({value: "watched:me ", text: "watched:me", type: "create"});
                            res.push({value: "watched:unassigned ", text: "watched:unassigned", type: "create"});
                            return searchUser(input, "watched:", res);
                        } else if (input.indexOf("updated:") === 0) {
                            res.push({value: "updated:late ", text: "updated:late", type: "create"});
                            res.push({value: "updated:today ", text: "updated:today", type: "create"});
                            res.push({value: "updated:yesterday ", text: "updated:yesterday", type: "create"});
                            res.push({value: "updated:this week ", text: "updated:this week", type: "create"});
                            res.push({value: "updated:this month ", text: "updated:this month", type: "create"});
                            res.push({value: "updated:previous week ", text: "updated:previous week", type: "create"});
                            res.push({
                                value: "updated:previous month ",
                                text: "updated:previous month",
                                type: "create"
                            });
                            res.push({value: "updated:last week ", text: "updated:last week", type: "create"});
                            res.push({value: "updated:last month ", text: "updated:last month", type: "create"});
                        } else if (input.indexOf("updated_by:") === 0) {
                            res.push({value: "updated_by:me ", text: "updated_by:me", type: "create"});
                            return searchUser(input, "updated_by:", res);
                        } else if (input.indexOf("status:") === 0) {
                            res.push({value: "status:OPEN ", text: "status:OPEN", type: "create"});
                            res.push({value: "status:CLOSED ", text: "status:CLOSED", type: "create"});
                            res.push({value: "status:BACKLOG ", text: "status:BACKLOG", type: "create"});
                            res.push({value: "status:DEFERRED ", text: "status:DEFERRED", type: "create"});
                        } else if (input.indexOf("location:") === 0) {
                            res.push({value: "location:BOARD ", text: "location:BOARD", type: "create"});
                            res.push({value: "location:ARCHIVE ", text: "location:ARCHIVE", type: "create"});
                            res.push({value: "location:BACKLOG ", text: "location:BACKLOG", type: "create"});
                            res.push({value: "location:TRASH ", text: "location:TRASH", type: "create"});
                        } else if (input.indexOf("created:") === 0) {
                            res.push({value: "created:late ", text: "created:late", type: "create"});
                            res.push({value: "created:today ", text: "created:today", type: "create"});
                            res.push({value: "created:yesterday ", text: "created:yesterday", type: "create"});
                            res.push({value: "created:this week ", text: "created:this week", type: "create"});
                            res.push({value: "created:this month ", text: "created:this month", type: "create"});
                            res.push({value: "created:previous week ", text: "created:previous week", type: "create"});
                            res.push({
                                value: "created:previous month ",
                                text: "created:previous month",
                                type: "create"
                            });
                            res.push({value: "created:last week ", text: "created:last week", type: "create"});
                            res.push({value: "created:last month ", text: "created:last month", type: "create"});
                        } else if (input.indexOf("due:") === 0) {
                            res.push({value: "due:late ", text: "due:late", type: "create"});
                            res.push({value: "due:today ", text: "due:today", type: "create"});
                            res.push({value: "due:yesterday ", text: "due:yesterday", type: "create"});
                            res.push({value: "due:this week ", text: "due:this week", type: "create"});
                            res.push({value: "due:this month ", text: "due:this month", type: "create"});
                            res.push({value: "due:next week ", text: "due:next week", type: "create"});
                            res.push({value: "due:next month ", text: "due:next month", type: "create"});
                            res.push({value: "due:previous week ", text: "due:previous week", type: "create"});
                            res.push({value: "due:previous month ", text: "due:previous month", type: "create"});
                            res.push({value: "due:last week ", text: "due:last week", type: "create"});
                            res.push({value: "due:last month ", text: "due:last month", type: "create"});
                        } else if (input.indexOf("milestone:") === 0) {
                            res.push({value: "milestone:unassigned ", text: "milestone:unassigned", type: "create"});
                            return searchMilestone(input, "milestone:", res);
                        } else if (input.indexOf("#") === 0) {
                            if (input.indexOf(":") < (input.length - 1)) {
                                return searchLabel(input, "#", res);
                            } else {
                                return searchLabelValues(input, res);
                            }
                        }
                        return res;
=======
                        res.push({value: "updated:last week ", text: "updated:last week", type: "create"});
                        res.push({value: "updated:last month ", text: "updated:last month", type: "create"});
                    } else if (input.indexOf("updated_by:") === 0) {
                        res.push({value: "updated_by:me ", text: "updated_by:me", type: "create"});
                        return searchUser(input, "updated_by:", res);
                    } else if (input.indexOf("status:") === 0) {
                        res.push({value: "status:OPEN ", text: "status:OPEN", type: "create"});
                        res.push({value: "status:CLOSED ", text: "status:CLOSED", type: "create"});
                        res.push({value: "status:BACKLOG ", text: "status:BACKLOG", type: "create"});
                        res.push({value: "status:DEFERRED ", text: "status:DEFERRED", type: "create"});
                    } else if (input.indexOf("location:") === 0) {
                        res.push({value: "location:BOARD ", text: "location:BOARD", type: "create"});
                        res.push({value: "location:ARCHIVE ", text: "location:ARCHIVE", type: "create"});
                        res.push({value: "location:BACKLOG ", text: "location:BACKLOG", type: "create"});
                        res.push({value: "location:TRASH ", text: "location:TRASH", type: "create"});
                    } else if (input.indexOf("created:") === 0) {
                        res.push({value: "created:late ", text: "created:late", type: "create"});
                        res.push({value: "created:today ", text: "created:today", type: "create"});
                        res.push({value: "created:yesterday ", text: "created:yesterday", type: "create"});
                        res.push({value: "created:this week ", text: "created:this week", type: "create"});
                        res.push({value: "created:this month ", text: "created:this month", type: "create"});
                        res.push({value: "created:previous week ", text: "created:previous week", type: "create"});
                        res.push({
                            value: "created:previous month ",
                            text: "created:previous month",
                            type: "create"
                        });
                        res.push({value: "created:last week ", text: "created:last week", type: "create"});
                        res.push({value: "created:last month ", text: "created:last month", type: "create"});
                    } else if (input.indexOf("due:") === 0) {
                        res.push({value: "due:late ", text: "due:late", type: "create"});
                        res.push({value: "due:today ", text: "due:today", type: "create"});
                        res.push({value: "due:yesterday ", text: "due:yesterday", type: "create"});
                        res.push({value: "due:this week ", text: "due:this week", type: "create"});
                        res.push({value: "due:this month ", text: "due:this month", type: "create"});
                        res.push({value: "due:next week ", text: "due:next week", type: "create"});
                        res.push({value: "due:next month ", text: "due:next month", type: "create"});
                        res.push({value: "due:previous week ", text: "due:previous week", type: "create"});
                        res.push({value: "due:previous month ", text: "due:previous month", type: "create"});
                        res.push({value: "due:last week ", text: "due:last week", type: "create"});
                        res.push({value: "due:last month ", text: "due:last month", type: "create"});
                    } else if (input.indexOf("milestone:") === 0) {
                        res.push({value: "milestone:unassigned ", text: "milestone:unassigned", type: "create"});
                        return searchMilestone(input, "milestone:", res);
                    } else if (input.indexOf("#") === 0) {
                        //if (input.indexOf(":") < (input.length - 1)) { FIXME
                            return searchLabel(input, "#", res);
                        //} else {
                            //return searchLabelValues(input, res);
                        //}
>>>>>>> 0abf1efd
                    }
                    return res;
                }

                
                //NEW AUTOCOMPLETE
                ctrl.querySearch = autocompleteProvider;
                ctrl.selected = [];
                ctrl.selectedItemChange = function(item) {
                	$log.debug(item);
                };
                ctrl.transformChip = function(chip) {
                	if(chip.type === 'example') {
                		$log.debug('example', chip);
                		ctrl.searchText = chip.value;
                		return null;
                	}
                	$log.debug(chip);
                	
                	if(angular.isString(chip)) {
                		chip = {value: chip, text:chip};
                	}
                	return chip;
                }
                //

                $rootScope.$on('requestSearch', function () {
                    $rootScope.$broadcast('refreshSearch', {searchFilter: rootSearchFilter, location: locationSearch});
                });


                $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {

                    //the transition search result -> card view should not modify the search bar
                    if ((fromState.name === 'board' && toState.name === 'board.card') ||
                        (fromState.name === 'projectSearch' && toState.name === 'projectSearch.card') ||
                        (fromState.name === 'globalSearch' && toState.name === 'globalSearch.card')) {
                        return;
                    }

                    if ((fromState.name === 'board.card' && toState.name === 'board') ||
                        (fromState.name === 'globalSearch.card' && toState.name === 'globalSearch') ||
                        (fromState.name === 'projectSearch.card' && toState.name === 'projectSearch')) {
                        $rootScope.$broadcast('refreshSearch', {
                            searchFilter: rootSearchFilter,
                            location: locationSearch
                        });
                    }
                    //transition to search controller -> restore the query in the input field
                    else if (toState.name === 'globalSearch' || toState.name === 'projectSearch') {
                        var search = $location.search();
                        if (search && search.q) {
                        	ctrl.selected = fromQueryToTags(tryParse(search.q, Search, $log));
                        }
                    }
                    //first load, reset
                    else if (fromState.name !== "") {
                        rootSearchFilter = undefined;
                        locationSearch = {};
                    }
                });

                $scope.$watch('lvgSearchInput.toSearch', function () {
                    if (ctrl.board !== undefined) {
                        parseAndBroadcastForBoardSearch(fromTagsToQuery(ctrl.selected), $log, $rootScope, Search);
                    }
                }, true);

                ctrl.submit = function () {
                    if (ctrl.board !== undefined) {
                        parseAndBroadcastForBoardSearch(fromTagsToQuery(ctrl.selected), $log, $rootScope, Search);
                    } else if (ctrl.project !== undefined) {
                        $location.url('/' + ctrl.project.shortName + '/search/?q=' + encodeURIComponent(fromTagsToQuery(ctrl.selected)));
                        $rootScope.$broadcast('refreshSearch');
                    } else {
                        $location.url('/search/?q=' + encodeURIComponent(fromTagsToQuery(ctrl.selected)));
                        $rootScope.$broadcast('refreshSearch');
                    }
                };

                //on first load:
                var search = $location.search();
                if (search && search.q) {
                    var res = tryParse(search.q, Search, $log);
                    if (queryIsNotEmpty(res)) {
                    	ctrl.selected = fromQueryToTags(res);
                        rootSearchFilter = res;
                        locationSearch = {q: search.q};
                    }
                }

            }
    });

})();
