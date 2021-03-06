// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('kidney', ['ionic', 'kidney.services', 'kidney.controllers', 'kidney.directives', 'kidney.filters', 'ngCordova', 'ngFileUpload', 'btford.socket-io', 'angular-jwt', 'highcharts-ng'])

.run(function (version, $ionicPlatform, $state, Storage, $location, $ionicHistory, $ionicPopup, $rootScope, CONFIG, notify, $interval, socket, mySocket, session) {
  // 主页面显示退出提示框
  $ionicPlatform.registerBackButtonAction(function (e) {
    e.preventDefault()
    function showConfirm () {
      var confirmPopup = $ionicPopup.confirm({
        title: '<strong>退出应用?</strong>',
        template: '你确定要退出应用吗?',
        okText: '退出',
        cancelText: '取消'
      })

      confirmPopup.then(function (res) {
        if (res) {
          ionic.Platform.exitApp()
        } else {
          // Don't close
        }
      })
    }
    showConfirm()
    return false
  }, 101)
  $ionicPlatform.ready(function () {
    // version.checkUpdate($rootScope)

    var isSignIN = Storage.get('isSignIN')
    thisPatient = null
    $rootScope.conversation = {
      type: null,
      id: ''
    }
    if (isSignIN == 'YES') {
      $state.go('tab.tasklist')
    }
    var appState = {
      background: false
    }
    document.addEventListener('pause', onPause, false)
    document.addEventListener('resume', onResume, false)
    function onPause () {
      appState.background = true
    }
    function onResume () {
      appState.background = false
      var id = Storage.get('UID')
       // name = thisDoctor === null ? '' : thisDoctor.name
      mySocket.newUserOnce(id)
    }
    socket.on('error', function (data) {
      console.error('socket error')
      console.log(data)
    })
    socket.on('disconnected', function (data) {
      console.error('disconnected')
      console.error(data)
    })
    socket.on('reconnect', function (attempt) {
      console.info('reconnect: ' + attempt)
      var id = Storage.get('UID'),
        name = thisPatient === null ? '' : thisPatient.name
      mySocket.newUser(id, name)
    })
    socket.on('kick', function () {
      session.logOut()
      $ionicPopup.alert({
        title: '请重新登录'
      }).then(function () {
        $state.go('signin')
      })
    })
    socket.on('getMsg', listenGetMsg)
    function listenGetMsg (data) {
      console.info('getMsg')
      console.log(data)
      if (!appState.background && (($rootScope.conversation.type == 'single' && $rootScope.conversation.id == data.msg.fromID) || ($rootScope.conversation.type == 'group' && $rootScope.conversation.id == data.msg.targetID))) return
      notify.add(data.msg)
    }
    if (window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true)

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true)
    }
    if (window.StatusBar) {
      StatusBar.backgroundColorByHexString('#33bbff')

      // StatusBar.styleDefault();
    }
    $rootScope.$on('$cordovaLocalNotification:click', function (event, note, state) {
      console.log(arguments)
      var msg = JSON.parse(note.data)
      if (msg.newsType == '11') {
        $state.go('tab.consult-chat', {chatId: msg.fromID})
      }
    })

    window.addEventListener('native.keyboardshow', function (e) {
      $rootScope.$broadcast('keyboardshow', e.keyboardHeight)
    })
    window.addEventListener('native.keyboardhide', function (e) {
      $rootScope.$broadcast('keyboardhide')
    })
  })
})

// --------路由, url模式设置----------------

.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js

  // ios 白屏可能问题配置
  $ionicConfigProvider.views.swipeBackEnabled(false)
  // 注册与登录
  $stateProvider
    .state('signin', {
      cache: false,
      url: '/signin',
      templateUrl: 'partials/login/signin.html',
      controller: 'SignInCtrl'
    })
    .state('agreement', {
      cache: false,
      url: '/agreeOrNot',
      params: {last: null},

      templateUrl: 'partials/login/agreement.html',
      controller: 'AgreeCtrl'
    })
    .state('phonevalid', {
      cache: false,
      url: '/phonevalid',
      params: {phonevalidType: null},
      templateUrl: 'partials/login/phonevalid.html',
      controller: 'phonevalidCtrl'
    })
    .state('setpassword', {
      cache: false,
      url: '/setpassword',
      params: {phonevalidType: null},
      templateUrl: 'partials/login/setpassword.html',
      controller: 'setPasswordCtrl'
    })
    .state('userdetail', {
      cache: false,
      url: 'mine/userdetail',
      params: {last: null},
      templateUrl: 'partials/login/userDetail.html',
      controller: 'userdetailCtrl'
    })
    .state('messages', {
      cache: false,
      url: '/messages',
      templateUrl: 'partials/messages/AllMessage.html',
      controller: 'messageCtrl'
    })
    .state('messagesDetail', {
      cache: false,
      url: '/messagesDetail',
      params: {messageType: null},
      templateUrl: 'partials/messages/VaryMessage.html',
      controller: 'VaryMessageCtrl'
    })
    .state('payment', {
      cache: false,
      url: '/payment',
      params: {messageType: null},
      templateUrl: 'partials/payment/payment.html',
      controller: 'paymentCtrl'
    })

    // 主页面
  $stateProvider
    .state('tab', {
      cache: false,
      abstract: true,
      url: '/tab',
      templateUrl: 'partials/tabs/tabs.html',
      controller: 'TabsCtrl'
    })
    .state('tab.tasklist', {
      url: '/tasklist',
      views: {
        'tab-tasks': {
          cache: false,
          templateUrl: 'partials/tabs/task/tasklist.html',
          controller: 'tasklistCtrl'
        }
      }
    })
    .state('tab.forum', {
      url: '/forum',
      views: {
        'tab-forum': {
          cache: false,
          templateUrl: 'partials/tabs/forum.html',
          controller: 'forumCtrl'
        }
      }
    })
    .state('tab.myDoctors', {
      url: '/myDoctors',
      views: {
        'tab-consult': {
          cache: false,
          templateUrl: 'partials/tabs/consult/myDoctors.html',
          controller: 'DoctorCtrl'
        }
      }
    })
    .state('tab.consult-chat', {
      url: '/consult/chat/:chatId',
      // params:{type:null,status:null,msgCount:null},
      views: {
        'tab-consult': {
          cache: false,
          templateUrl: 'partials/tabs/consult/consult-chat.html',
          controller: 'ChatCtrl'
        }
      }
    })
    .state('tab.consult-comment', {
      url: '/consult/comment',
      params: {counselId: null, doctorId: null, patientId: null},
      cache: false,
      views: {
        'tab-consult': {
          cache: false,
          templateUrl: 'partials/tabs/consult/commentDoctor.html',
          controller: 'SetCommentCtrl'
        }
      }
    })
    .state('tab.AllDoctors', {
      url: '/AllDoctors',
      views: {
        'tab-consult': {
          cache: false,
          templateUrl: 'partials/tabs/consult/allDoctors.html',
          controller: 'AllDoctorsCtrl'
        }
      }
    })
    .state('tab.DoctorDetail', {
      url: '/DoctorDetail/:DoctorId',
      views: {
        'tab-consult': {
          cache: false,
          templateUrl: 'partials/tabs/consult/DoctorDetail.html',
          controller: 'DoctorDetailCtrl'
        }
      }
    })
    .state('tab.applyDoctor', {
      url: '/applyDoctor',
      params: {applyDoc: null},
      views: {
        'tab-consult': {
          cache: false,
          templateUrl: 'partials/tabs/consult/applyDocInCharge.html',
          controller: 'applyDocCtrl'
        }
      }
    })
    .state('tab.appointDoctor', {
      url: '/DoctorAppointment',
      params: {appointDoc: null},
      views: {
        'tab-consult': {
          cache: false,
          templateUrl: 'partials/tabs/consult/docAppointment.html',
          controller: 'appointmentCtrl'
        }
      }
    })
    .state('tab.consultQuestionnaire', {
      url: '/Questionnaire',
      params: {DoctorId: null, counselType: null},
      views: {
        'tab-consult': {
          cache: true,
          templateUrl: 'partials/tabs/consult/questionnaire.html',
          controller: 'consultquestionCtrl'
        }
      }
    })
    .state('tab.healthList', {
      url: '/healthList',
      views: {
        'tab-consult': {
          cache: true,
          templateUrl: 'partials/tabs/consult/healthList.html',
          controller: 'healthListCtrl'
        }
      }
      // params:{DoctorId:null}
    })

    .state('tab.mine', {
      url: '/mine',
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/mine/mine.html',
          controller: 'MineCtrl'
        }

      }

    })
    .state('tab.DiagnosisInfo', {
      url: '/mine/DiagnosisInfo',
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/mine/diagnosisInfo.html',
          controller: 'DiagnosisCtrl'
        }

      }

    })
    .state('tab.myConsultRecord', {
      url: '/mine/ConsultRecord',
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/mine/consultRecord.html',
          controller: 'ConsultRecordCtrl'
        }

      }

    })
    .state('tab.myHealthInfo', {
      url: '/mine/health/HealthInfo',
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/mine/health/HealthInfo.html',
          controller: 'HealthInfoCtrl'
        }

      }

    })
    .state('tab.myHealthInfoDetail', {
      cache: false,
      url: '/mine/health/HealthInfoDetail',
      params: {id: null, caneidt: null},
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/mine/health/editHealthInfo.html',
          controller: 'HealthDetailCtrl'
        }

      }

    })
    .state('tab.urineDoctor', {
      cache: false,
      url: '/mine/urineDoctor',
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/mine/urineDoctor.html',
          controller: 'urineDoctorCtrl'
        }

      }

    })
    .state('tab.myMoney', {
      url: '/mine/Account',
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/mine/account/money.html',
          controller: 'MoneyCtrl'
        }
      }
    })

    .state('orderRecord', {
      cache: false,
      url: '/order',
      templateUrl: 'partials/tabs/mine/account/orderRecord.html',
      controller: 'OrderCtrl'
    })

    .state('tab.about', {
      url: '/mine/about',
      views: {
        'tab-mine': {
          templateUrl: 'partials/about.html',
          controller: 'aboutCtrl'
        }
      }

    })
    .state('tab.advice', {
      cache: false,
      url: '/mine/advice/',
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/mine/advice.html',
          controller: 'adviceCtrl'
        }
      }
    })
     // 我的二维码
    .state('tab.QRcode', {
      url: '/mine/qrcode/',
      views: {
        'tab-mine': {
          // cache: false,
          controller: 'QRcodeCtrl',
          templateUrl: 'partials/tabs/mine/qrcode.html'
        }
      }
    })
    .state('tab.changePassword', {
      cache: false,
      url: '/mine/changePassword',
      views: {
        'tab-mine': {
          templateUrl: 'partials/changePassword.html',
          controller: 'changePasswordCtrl'
        }
      }

    })

    .state('tab.taskSet', {
      url: '/mine/taskSet/',
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/task/taskSet.html',
          controller: 'TaskSetCtrl'
        }
      }
    })

    .state('tab.devices', {
      url: '/mine/devices/',
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/mine/devices.html',
          controller: 'devicesCtrl'
        }
      }
    })

    .state('tab.Reports', {
      url: '/mine/Reports/',
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/mine/Reports.html',
          controller: 'ReportsCtrl'

        }
      }
    })
    .state('tab.monthReports', {
      url: '/mine/monthReports/',
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/mine/monthReports.html',
          controller: 'monthReportsCtrl'
        }
      }
    })
    .state('tab.seasonReports', {
      url: '/mine/seasonReports/',
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/mine/seasonReports.html',
          controller: 'seasonReportsCtrl'
        }
      }
    })
    .state('tab.yearReports', {
      url: '/mine/yearReports/',
      views: {
        'tab-mine': {
          templateUrl: 'partials/tabs/mine/yearReports.html',
          controller: 'yearReportsCtrl'
        }
      }
    })

     // 肾病保险
  $stateProvider
    .state('insurance', {
      cache: false,
      url: '/insurance',
      templateUrl: 'partials/insurance/insurance.html',
      controller: 'insuranceCtrl'
    })
    .state('intension', {
      cache: false,
      url: '/intension',
      templateUrl: 'partials/insurance/intension.html',
      controller: 'insuranceCtrl'
    })
    .state('insuranceexpense', {
      cache: false,
      url: '/insuranceexpense',
      templateUrl: 'partials/insurance/insuranceexpense.html',
      controller: 'insurancefunctionCtrl'
    })
    .state('kidneyfunction', {
      cache: false,
      url: '/kidneyfunction',
      templateUrl: 'partials/insurance/kidneyfunction.html',
      controller: 'insurancefunctionCtrl'
    })
    .state('insurancestafflogin', {
      cache: false,
      url: '/insurancestafflogin',
      templateUrl: 'partials/insurance/insurancestafflogin.html',
      controller: 'insurancestaffCtrl'
    })
    .state('insurancestaff', {
      cache: false,
      url: '/insurancestaff',
      templateUrl: 'partials/insurance/insurancestaff.html',
      controller: 'insurancestaffCtrl'
    })

  $urlRouterProvider.otherwise('/signin')
})

// $httpProvider.interceptors提供http request及response的预处理
.config(['$httpProvider', 'jwtOptionsProvider', function ($httpProvider, jwtOptionsProvider) {
    // 下面的getter可以注入各种服务, service, factory, value, constant, provider等, constant, provider可以直接在.config中注入, 但是前3者不行
  jwtOptionsProvider.config({
    whiteListedDomains: ['121.196.221.44', '121.43.107.106', 'testpatient.haihonghospitalmanagement.com', 'testdoctor.haihonghospitalmanagement.com', 'patient.haihonghospitalmanagement.com', 'doctor.haihonghospitalmanagement.com', 'localhost'],
    tokenGetter: ['options', 'jwtHelper', '$http', 'CONFIG', 'Storage', '$state', '$ionicPopup', function (options, jwtHelper, $http, CONFIG, Storage, $state, $ionicPopup) {
         // console.log(config);
        // console.log(CONFIG.baseUrl);

        // var token = sessionStorage.getItem('token');
      var token = Storage.get('TOKEN')
        // var refreshToken = sessionStorage.getItem('refreshToken');
      var refreshToken = Storage.get('refreshToken')
      if (!token && !refreshToken) {
        return null
      }

      var isExpired = true
      // debugger
      try {
          /*
           * 由于jwt自带的过期判断方法与服务器端使用的加密方法不匹配，使用jwthelper解码的方法对token进行解码后自行判断token是否过期
           */
            // isExpired = jwtHelper.isTokenExpired(token);
        var temp = jwtHelper.decodeToken(token)
        if (temp.exp === 'undefined') {
          isExpired = false
        } else {
              // var d = new Date(0); // The 0 here is the key, which sets the date to the epoch
              // d.setUTCSeconds(temp.expireAfter);
          isExpired = !(temp.exp > new Date().valueOf())// (new Date().valueOf() - 8*3600*1000));
              // console.log(temp)
        }

             // console.log(isExpired);
      } catch (e) {
        console.log(e)
        isExpired = true
      }
        // 这里如果同时http.get两个模板, 会产生两个$http请求, 插入两次jwtInterceptor, 执行两次getrefreshtoken的刷新token操作, 会导致同时查询redis的操作, ×××估计由于数据库锁的关系×××(由于token_manager.js中的exports.refreshToken中直接删除了redis数据库里前一个refreshToken, 导致同时发起的附带有这个refreshToken的getrefreshtoken请求查询返回reply为null, 导致返回"凭证不存在!"错误), 其中一次会查询失败, 导致返回"凭证不存在!"错误, 使程序流程出现异常(但是为什么会出现模板不能加载的情况? 是什么地方阻止了模板的下载?)
      if (options.url.substr(options.url.length - 5) === '.html' || options.url.substr(options.url.length - 3) === '.js' || options.url.substr(options.url.length - 4) === '.css' || options.url.substr(options.url.length - 4) === '.jpg' || options.url.substr(options.url.length - 4) === '.png' || options.url.substr(options.url.length - 4) === '.ico' || options.url.substr(options.url.length - 5) === '.woff') {  // 应该把这个放到最前面, 否则.html模板载入前会要求refreshToken, 如果封装成APP后, 这个就没用了, 因为都在本地, 不需要从服务器上获取, 也就不存在http get请求, 也就不会interceptors
             // console.log(config.url);
        return null
      } else if (isExpired) {    // 需要加上refreshToken条件, 否则会出现网页循环跳转
            // This is a promise of a JWT token
             // console.log(token);
        if (refreshToken && refreshToken.length >= 16) {  // refreshToken字符串长度应该大于16, 小于即为非法
                /**
                 * [刷新token]
                 * @Author   TongDanyang
                 * @DateTime 2017-07-05
                 * @param    {[string]}  refreshToken [description]
                 * @return   {[object]}  data.results  [新的token信息]
                 */
          return $http({
            url: CONFIG.baseUrl + 'token/refresh?refresh_token=' + refreshToken,
                    // This makes it so that this request doesn't send the JWT
            skipAuthorization: true,
            method: 'GET',
            timeout: 5000
          }).then(function (res) { // $http返回的值不同于$resource, 包含config等对象, 其中数据在res.data中
                     // console.log(res);
                    // sessionStorage.setItem('token', res.data.token);
                    // sessionStorage.setItem('refreshToken', res.data.refreshToken);
            Storage.set('TOKEN', res.data.results.token)
            Storage.set('refreshToken', res.data.results.refreshToken)
            return res.data.results.token
          }, function (err) {
            console.log(err)
            if (refreshToken == Storage.get('refreshToken')) {
                      // console.log("凭证不存在!")
              console.log(options)
              $ionicPopup.show({
                title: '您离开太久了，请重新登录',
                buttons: [
                  {
                    text: '取消',
                    type: 'button'
                  },
                  {
                    text: '確定',
                    type: 'button-positive',
                    onTap: function (e) {
                      $state.go('signin')
                    }
                  }
                ]
              })
            }
                    // sessionStorage.removeItem('token');
                    // sessionStorage.removeItem('refreshToken');
                    // Storage.rm('token');
                    // Storage.rm('refreshToken');
            return null
          })
        } else {
          Storage.rm('refreshToken')  // 如果是非法refreshToken, 删除之
          return null
        }
      } else {
            // console.log(token);
        return token
      }
    }]
  })

  $httpProvider.interceptors.push('jwtInterceptor')
}])
