angular.module('app')
  .controller('IndexController', function ($scope, $rootScope, UserService, FeedbackService, CatalogService, statesRepository, RegionListFactory, LocalityListFactory, $filter, messageBusService, stateStorageService, AdminService, $state, $stateParams) {
    // See why it's needed for navbar:
    // http://stackoverflow.com/questions/14741988/twitter-bootstrap-navbar-with-angular-js-collapse-not-functioning
    $scope.navBarIsCollapsed = true;
    $scope.navBarStatusVisible = false;
    $scope.logout = function () {
      UserService.logout();
      $scope.navBarStatusVisible = false;
      $rootScope.$broadcast('logout.event', {
        isLogged: false
      });
    };
    $scope.catalogAll = [];

    $scope.$watch('catalogAll',function (newVal, oldVal) {
      // console.log($state.is('index.oldbusiness'));
      // console.log($state.current);
      // console.log($scope.sSearch);
      if(!!$scope.sSearch == true){
        if ($state.is('index.oldbusiness')) {
          $scope.setPageBusiness(1);
        } else {
          $scope.setPage(1);
        }
      }
    });

    window.logout = function () {
      UserService.logout();
      $scope.navBarStatusVisible = false;
      $rootScope.$broadcast('logout.event', {
        isLogged: false
      });
    };
    UserService.isLoggedIn().then(function (result) {
      // console.log(result);
      $scope.navBarStatusVisible = result;
      UserService.fio().then(function (res) {
        // console.log(res);
        $scope.userName = {
          firstName: capitalize(res.firstName),
          lastName: capitalize(res.lastName)
        }
      });
    }, function () {
      $scope.navBarStatusVisible = false;
    });

    function capitalize(string) {
      return string !== null && string !== undefined ? string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() : '';
    }


    //TODO custom search
    var fullCatalog = [];
    var subscriptions = [];
    var sID_Order_RegExp = /^\d$|^\d-$|^\d-\d+$/;
    var sID_Order_Full_RegExp = /^\d-\d+$/;


    $scope.isSearch = statesRepository.isSearch();
    $scope.getOrgan = statesRepository.getOrgan();
    $scope.isCentral = statesRepository.isCentral();
    $scope.regionList = new RegionListFactory();
    $scope.regionList.load(null, null);
    $scope.localityList = new LocalityListFactory();
    $scope.operators = [];
    $scope.check = false;
    $rootScope.isOldStyleView = !!statesRepository.isDFS();
    $scope.mainSearchView = false;
    $scope.catalogCounts = {};

    // set defaults
    var defaultSettings = {
      sSearch: '',
      operator: -1,
      selectedStatus: -1,
      bShowExtSearch: false,
      data: {
        region: null,
        city: null
      }
    };
    // restore search settings (if available)
    var searchSettings = stateStorageService.getState('igovSearch');
    searchSettings = searchSettings ? searchSettings : defaultSettings;

    restoreSettings(searchSettings);

    function restoreSettings(settings) {
      // todo: iterate over keys;
      $scope.sSearch = settings.sSearch;
      $scope.operator = settings.operator;
      $scope.selectedStatus = settings.selectedStatus;
      $scope.bShowExtSearch = settings.bShowExtSearch;
      $scope.data = settings.data;
    }

    function getIDPlaces() {
      var result;
      if ($scope.bShowExtSearch && $scope.data.region !== null && $scope.data.region !== "") {
        var places = [$scope.data.city === null ? $scope.data.region : ''].concat($scope.data.city === null ? $scope.data.region.aCity : $scope.data.city);

        result = places.map(function (e) {
          return e.sID_UA;
        });
      } else {
        result = statesRepository.getIDPlaces();
      }
      return result;
    }

    function updateCatalog(ctlg) {
      $scope.catalogAll = ctlg;
      if ($scope.operator == -1) {
        // временно для старого бизнеса, после реализации тегов - удалить.
        if ($state.is("index.oldbusiness") || $state.is("index.subcategory") || $rootScope.isOldStyleView) {
          $scope.operators = CatalogService.getOperatorsOld(ctlg);
        } else {
          $scope.operators = CatalogService.getOperators(ctlg);
        }
      }
      messageBusService.publish('catalog:update', ctlg);
    }

    // получаем к-во услуг готовых/скоро/в работе
    function getCounts(category) {
      var countCategory = category && category.aService || category && category[0].aService ? category : 'business';
      if (countCategory === 'business' || $rootScope.isOldStyleView) {
        CatalogService.getModeSpecificServices(null, "", false, countCategory).then(function (res) {
          $scope.catalogCounts = CatalogService.getCatalogCounts(res)
        })
      } else {
        $scope.catalogCounts = CatalogService.getCatalogCounts(countCategory)
      }
    }

    // getCounts();

    function isFilterActive() {
      $rootScope.mainSearchView = !!(($state.is('index') || $state.is('index.catalog')) && $scope.data.region);
    }

    function GetPager(totalItems, currentPage, pageSize) {
      // default to first page
      currentPage = currentPage || 1;

      // default page size is 10
      pageSize = pageSize || 10;

      // calculate total pages
      var totalPages = Math.ceil(totalItems / pageSize);

      var startPage, endPage;
      if (totalPages <= 10) {
        // less than 10 total pages so show all
        startPage = 1;
        endPage = totalPages;
      } else {
        // more than 10 total pages so calculate start and end pages
        if (currentPage <= 6) {
          startPage = 1;
          endPage = 10;
        } else if (currentPage + 4 >= totalPages) {
          startPage = totalPages - 9;
          endPage = totalPages;
        } else {
          startPage = currentPage - 5;
          endPage = currentPage + 4;
        }
      }

      // calculate start and end item indexes
      var startIndex = (currentPage - 1) * pageSize;
      var endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

      // create an array of pages to ng-repeat in the pager control
      var pages = Array.apply(null, {length: endPage + 1}).map(Number.call, Number);
      pages.shift();
      return {
        totalItems: totalItems,
        currentPage: currentPage,
        pageSize: pageSize,
        totalPages: totalPages,
        startPage: startPage,
        endPage: endPage,
        startIndex: startIndex,
        endIndex: endIndex,
        pages: pages
      };
    }

    $scope.pager = {};
    $scope.setPage = function (page) {
      if (page < 1 || page > $scope.pager.totalPages) {
        return;
      }

      // get pager object from service
      var arr = $scope.catalogAll.aService;
      $scope.pager = GetPager(arr.length, page, 20);
      // get current page of items
      $scope.catalog.aService = arr.slice($scope.pager.startIndex, $scope.pager.endIndex + 1);
    }
    $scope.pagerBusiness = {};
    $scope.setPageBusiness = function (page) {
      if (page < 1 || page > $scope.pagerBusiness.totalPages) {
        return;
      }

      // get pager object from service
      var arr = [];
      $scope.catalogAll.forEach(function (category) {
        if (category.aSubcategory && Array.isArray(category.aSubcategory)) {
          category.aSubcategory.forEach(function (subcategory) {
            if (subcategory.aService && Array.isArray(subcategory.aService)) {
              subcategory.aService.forEach(function (service) {
                arr.push(service)
              })
            }
          })
        }
      });
      $scope.pagerBusiness = GetPager(arr.length, page, 20);
      // get current page of items
      $scope.catalog = arr.slice($scope.pagerBusiness.startIndex, $scope.pagerBusiness.endIndex + 1);
    }

    $scope.search = function () {
      $rootScope.searchPage = $scope;
      if (sID_Order_RegExp.test($scope.sSearch)) {
        return null;
      }
      $rootScope.minSearchLength = $scope.sSearch.length < 3;
      var bShowEmptyFolders = AdminService.isAdmin();
      $scope.spinner = true;
      messageBusService.publish('catalog:updatePending');
      $scope.catalog = [];
      $scope.category = $stateParams.catID;
      $scope.subcategory = $stateParams.scatID;
      if ($state.is('index.situation') || $state.is('index.situation.print')) {
        $scope.situation = $stateParams.sitID;
        // поиск для старого бизнеса, когда будут доработаны теги в новом - удалить.
      } else if ($state.is("index.oldbusiness") || $state.is("index.subcategory")) {
        $scope.category = 'business';
      }

      var sID_SubjectOwner = !!statesRepository.isDFS() ? 'SFS' : null;

      return CatalogService.getModeSpecificServices(getIDPlaces(), $scope.sSearch, bShowEmptyFolders, $scope.category, $scope.subcategory, $stateParams.sitID, $rootScope.mainFilterCatalog, sID_SubjectOwner).then(function (result) {
        // console.log(result,$state);
        if (!$state.is('index')
          && !$state.is('index.catalog') && !($state.is("index.oldbusiness") || $rootScope.isOldStyleView) && !$state.is("index.subcategory")) {
          fullCatalog = result[0];
          if (Array.isArray(fullCatalog)) {
            fullCatalog = fullCatalog.map(function (val) {
              val.aServiceTag_Child = val.aServiceTag_Child.map(function (item) {
                var to = item.sName_UA.indexOf(']');
                item.sName_UA = item.sName_UA.substr(to + 1);
                return item
              })
              return val
            });
          }
        } else if (($state.is("index.oldbusiness") || $rootScope.isOldStyleView) && result.length === 1 && result[0].aSubcategory.length > 0) {
          fullCatalog = result[0]
        } else {
          fullCatalog = result;
          if (Array.isArray(fullCatalog)) {
            fullCatalog = fullCatalog.map(function (val) {
              if (Array.isArray(val.aServiceTag_Child)) {
                val.aServiceTag_Child = val.aServiceTag_Child.map(function (item) {
                  var to = item.sName_UA.indexOf(']');
                  item.sName_UA = item.sName_UA.substr(to + 1);
                  return item
                })
              }
              return val
            });
          }
        }

        if ($scope.bShowExtSearch || $scope.getOrgan) {
          $scope.filterByExtSearch();
        } else if ($scope.check) {
          updateCatalog(angular.copy(fullCatalog));
          $scope.check = false;
        } else {
          updateCatalog(angular.copy(fullCatalog));
        }

        if (result.length === 0) {
          $rootScope.wasSearched = true;
        }

        $rootScope.resultsAreLoading = false;
        getCounts(fullCatalog);
      });
    };

    $scope.searching = function () {
      // проверка на минимальне к-во символов в поисковике (искать должно от 3 символов)
      if ($scope.sSearch.length >= 3 && ($state.is("index.oldbusiness") || $rootScope.isOldStyleView)) {
        $rootScope.busSpinner = true;
        $scope.overallSearch();
        $rootScope.mainSearchView = true;
        $rootScope.valid = true;
      } else if ($scope.sSearch.length >= 3 && ($state.is("index") || $state.is("index.catalog"))) {
        $rootScope.resultsAreLoading = true;
        $rootScope.mainSearchView = true;
        $rootScope.busSpinner = true;
        $scope.search();
        $rootScope.valid = true;
      } else if ($scope.sSearch.length >= 3 && (!$state.is("index") || !$state.is("index.catalog"))) {
        $state.go('index.catalog');
        $rootScope.resultsAreLoading = true;
        $rootScope.mainSearchView = true;
        $rootScope.busSpinner = true;
        $scope.search();
        console.log('!$state.is("index")');
        $rootScope.valid = true;
      } else if ($rootScope.valid) {
        $rootScope.resultsAreLoading = true;
        $rootScope.valid = false;
        $rootScope.mainSearchView = false;
        $scope.search();
      } else {
        $rootScope.busSpinner = true;
        $scope.search();
        $rootScope.valid = true;
      }
      $scope.spinner = false;
    };

    // глобальный поиск по Гражд. и Бизн.
    $scope.overallSearch = function () {
      $rootScope.resultsAreLoading = true;
      if (sID_Order_RegExp.test($scope.sSearch)) return null;
      $rootScope.minSearchLength = $scope.sSearch.length < 3;
      var bShowEmptyFolders = AdminService.isAdmin();
      $scope.spinner = true;
      messageBusService.publish('catalog:updatePending');
      $scope.catalog = [];
      return CatalogService.getModeSpecificServices(getIDPlaces(), $scope.sSearch, bShowEmptyFolders, 'business').then(function (result) {
        fullCatalog = result;
        if (!!$scope.bShowExtSearch==true || !!$scope.getOrgan == true) {
          $scope.filterByExtSearch();
        } else {
          updateCatalog(angular.copy(fullCatalog));
        }
        $rootScope.resultsAreLoading = false;
      });
    };
    $scope.searchOrder = function (el) {
      if (sID_Order_Full_RegExp.test($scope.sSearch)) {
        $state.go('index.search', {sID_Order: $scope.sSearch});
      } else {
        if ($scope.sSearch.length >= 3) {
          console.log($state);
        }
      }
    };
    // method to filter full catalog depending on current extended search parameters
    // choosen by user
    $scope.filterByExtSearch = function () {
      $scope.check = true;
      var ctlg;

      var filterCriteria = {};
      if ($scope.operator != -1) {
        filterCriteria.sSubjectOperatorName = $scope.operator;
      }
      if ($scope.getOrgan) {
        filterCriteria.sSubjectOperatorName = $scope.getOrgan;
      }

      // сейчас джава выдает другие номера статусов, поэтому меняю для работоспособности. убрать когда теги в бизнесе будут готовы.
      // убрать когда теги в бизнесе будут готовы.
      if ($state.is("index.oldbusiness") || $state.is("index.subcategory") || $rootScope.isOldStyleView) {
        var selectedStatus;
        if ($scope.selectedStatus == 0) {
          selectedStatus = 1;
        } else if ($scope.selectedStatus == 1) {
          selectedStatus = 2;
        }
        if ($scope.selectedStatus != -1) {
          filterCriteria.nStatus = selectedStatus;
        }

        // create a copy of current fullCatalog
        ctlg = angular.copy(fullCatalog);
        angular.forEach(ctlg, function (category) {
          angular.forEach(category.aSubcategory, function (subCategory) {
            // leave services that match filterCriteria
            console.log(subCategory);
            subCategory.aService = $filter('filter')(subCategory.aService, filterCriteria);
          });
          // leave subcategories that are not empty
          category.aSubcategory = $filter('filter')(category.aSubcategory, function (subCategory) {
            if (subCategory.aService.length > 0) {
              return true;
            }
          });
        });
        // leave categories that are not empty
        ctlg = $filter('filter')(ctlg, function (category) {
          if (category.aSubcategory.length > 0) {
            return true;
          }
        });
      } else {
        if ($scope.selectedStatus != -1) {
          filterCriteria.nStatus = $scope.selectedStatus;
        }

        // create a copy of current fullCatalog
        ctlg = angular.copy(fullCatalog);
        ctlg.aService = $filter('filter')(ctlg.aService, filterCriteria);
        // TODO поправить
        ctlg.aServiceTag_Child = $filter('filter')(ctlg.aServiceTag_Child, function (category) {
          return true;
        });
      }

      updateCatalog(ctlg);
    };

    $scope.onExtSearchClick = function () {
      $scope.bShowExtSearch = !$scope.bShowExtSearch;
      if ($scope.bShowExtSearch) {
        $scope.searching();
      }
    };
    $rootScope.clear = function () {
      restoreSettings(defaultSettings);
      if ($rootScope.mainFilterCatalog) $rootScope.mainFilterCatalog = false;
      $scope.searching();
    };
    $scope.loadRegionList = function (search) {
      return $scope.regionList.load(null, search);
    };
    $scope.onSelectRegionList = function ($item) {
      $rootScope.resultsAreLoading = true;
      $scope.data.region = $item;
      $scope.regionList.select($item);
      $scope.data.city = null;
      $scope.localityList.reset();
      if ($state.is('index') || $state.is('index.catalog')) {
        $rootScope.mainFilterCatalog = true;
      }
      $scope.search();
      $scope.localityList.load(null, $item.nID, null).then(function (cities) {
        $scope.localityList.typeahead.defaultList = cities;
      });
      isFilterActive()
    };

    $scope.loadLocalityList = function (search) {
      return $scope.localityList.load(null, $scope.data.region.nID, search);
    };

    $scope.onSelectLocalityList = function ($item, $model, $label) {
      $rootScope.resultsAreLoading = true;
      $scope.data.city = $item;
      $scope.localityList.select($item, $model, $label);
      $scope.search();
      isFilterActive()
    };
    // $scope.search();

    var subscriberId = messageBusService.subscribe('catalog:initUpdate', function () {
      $scope.search();
    });
    subscriptions.push(subscriberId);

    // save current state on scope destroy
    $scope.$on('$destroy', function () {
      var state = {};
      state.sSearch = $scope.sSearch;
      state.operator = $scope.operator;
      state.selectedStatus = $scope.selectedStatus;
      state.bShowExtSearch = $scope.bShowExtSearch;
      state.data = $scope.data;
      stateStorageService.setState('igovSearch', state);
      subscriptions.forEach(function (item) {
        messageBusService.unsubscribe(item);
      });
    });
    jQuery.fn.highlight = function (str, className) {
      var regex = new RegExp(str, "gi");
      return this.each(function () {
        $(this).contents().filter(function () {
          return this.nodeType == 3 && regex.test(this.nodeValue);
        }).replaceWith(function () {
          return (this.nodeValue || "").replace(regex, function (match) {
            return "<span class=\"" + className + "\">" + match + "</span>";
          });
        });
      });
    };
    $rootScope.$watch('rand', function () {
      if ($scope.sSearch.length >= 3) {
        setTimeout(function () {
          $(".igov-container a").highlight($scope.sSearch, "marked-string");
        }, 100)
      }
    });
    $scope.$watch('data.region', function () {
      if (!$scope.data.region) {
        $rootScope.resultsAreLoading = true;
        $rootScope.mainFilterCatalog = false;
        // isFilterActive();
        $scope.searching();
      }
    });
    $scope.$on('$stateChangeSuccess', function (event, toState) {
      // console.log(toState);
      if (toState.resolve) {
        $scope.spinner = false;
        //
        if (toState.name == 'index' || toState.name == "index.oldbusiness")$scope.search();
      }
    });
  })
