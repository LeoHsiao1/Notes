module.exports = {
	title: "LeoHsiao's Notes",
	description: ' ',
	host: '0.0.0.0',
	port: 80,
	base: '/',
	dest: 'docs/.vuepress/dist',
	lang: 'zh-CN',
	plugins: [
		['@vuepress/back-to-top', true],
		['@vuepress/google-analytics', {
			'ga': 'UA-155748502-1'
		}],
		['sitemap', {
			hostname: 'http://leohsiao.com'
		}],
	],
	themeConfig: {
		repo: 'https://github.com/LeoHsiao1/Notes',
		repoLabel: 'GitHub',
		docsDir: 'docs',
		docsBranch: 'master',
		editLinks: true,
		editLinkText: 'Edit on GitHub',
		lastUpdated: 'Last Updated',
		smoothScroll: true,
		nav: [{
			text: 'Notes',
			items: [{
					text: '《Python》',
					link: '/Python/index'
				},
				{
					text: '《Linux》',
					link: '/Linux/index'
				},
				{
					text: '《数据库》',
					link: '/Database/index'
				},
				{
					text: '《计算机网络》',
					link: '/Computer-Network/index'
				},
				{
					text: '《Web》',
					link: '/Web/index'
				},
				{
					text: '《DevOps》',
					link: '/DevOps/index'
				}
			]
		}],
		sidebar: {
			'/Python/': [{
					title: '《Python》',
					path: '/Python/',
				},
				{
					title: '简介',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'简介/简介',
						'简介/解释器',
						'简介/版本差异',
					]
				},
				{
					title: '文本处理',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'文本处理/jinja',
					]
				},
				{
					title: '混合开发',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'混合开发/简介',
						'混合开发/^ctypes',
						'混合开发/^Cython',
						'混合开发/SWIG',
						'混合开发/pybind11',
					]
				},
			],
			'/Linux/': [{
					title: '《Linux》',
					path: '/Linux/',
				},
				{
					title: '简介',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'简介/简介',
						'简介/相关概念',
					]
				},
				{
					title: '终端',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'终端/终端',
						'终端/命令',
						'终端/开机',
						'终端/登录',
						'终端/用户',
					]
				},
				{
					title: '进程',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'进程/进程',
						'进程/管理进程',
					]
				},
				{
					title: '文件',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'文件/文件',
						'文件/管理文件',
						'文件/管理文本',
						'文件/文件属性',
						'文件/文件权限',
						'文件/目录',
					]
				},
				{
					title: '设备',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'设备/设备',
						'设备/外存',
						'设备/文件系统',
						'设备/内存',
					]
				},
				{
					title: '网络',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'网络/IP',
						'网络/TCP-UDP',
						'网络/防火墙',
						'网络/SSH',
						'网络/HTTP',
						'网络/FTP',
					]
				},
				{
					title: '测试',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'测试/简介',
						'测试/进程测试',
						'测试/CPU测试',
						'测试/网络测试',
						'测试/综合测试工具',
					]
				},
				{
					title: 'shell',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'shell/解释器',
						'shell/变量',
						'shell/基本语法',
					]
				},
				{
					title: '内核',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'内核/简介',
					]
				},
				{
					title: '其它',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'其它/时间',
						'其它/定时任务',
						'其它/系统信息',
						'其它/安装软件',
						'其它/插件工具',
						'其它/gcc',
						'其它/OpenWrt',
					]
				},
			],
			'/Database/': [{
					title: '《数据库》',
					path: '/Database/',
				},
				{
					title: '简介',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'简介/简介',
						'简介/事务',
					]
				},
				{
					title: 'SQLite',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'SQLite/SQLite',
						'SQLite/^sqlite3',
					]
				},
				{
					title: 'MySQL',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'MySQL/MySQL',
						'MySQL/用户权限',
						'MySQL/管理单元',
						'MySQL/数据类型',
						'MySQL/函数',
						'MySQL/数据库引擎',
						'MySQL/备份数据',
						'MySQL/性能优化',
						'MySQL/部署架构',
						'MySQL/^PyMySQL',
						'MySQL/^SQLAlchemy',
					]
				},
				{
					title: 'MongoDB',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'MongoDB/MongoDB',
						'MongoDB/管理单元',
						'MongoDB/其它功能',
						'MongoDB/性能优化',
						'MongoDB/部署架构',
						'MongoDB/^pymongo',
					]
				},
				{
					title: 'Redis',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'Redis/Redis',
						'Redis/管理单元',
						'Redis/数据类型',
						'Redis/其它功能',
						'Redis/性能优化',
						'Redis/部署架构',
						'Redis/^redis',
					]
				},
			],
			'/Computer-Network/': [{
					title: '《计算机网络》',
					path: '/Computer-Network/',
				},
				{
					title: '计算机网络',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'计算机网络/简介',
						'计算机网络/通信线路',
						'计算机网络/数据编码',
						'计算机网络/数据传输',
						'计算机网络/覆盖范围',
					]
				},
				{
					title: '通信设备',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'通信设备/简介',
						'通信设备/交换机',
						'通信设备/路由器',
					]
				},
				{
					title: 'TCP/IP协议',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'TCP-IP协议/网络体系结构',
						'TCP-IP协议/IP协议',
						'TCP-IP协议/TCP-UDP协议',
					]
				},
				{
					title: '网络通信协议',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'网络通信协议/简介',
						'网络通信协议/域名',
						'网络通信协议/Socket',
						'网络通信协议/邮件协议',
						'网络通信协议/FTP',
						'网络通信协议/HTTP',
						'网络通信协议/WebSocket',
						'网络通信协议/网络代理',
						'网络通信协议/MQTT',
					]
				},
				{
					title: '计算机安全',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'计算机安全/恶意代码',
						'计算机安全/网络安全',
					]
				},
			],
			'/Web/': [{
					title: '《Web》',
					path: '/Web/',
				},
				{
					title: '简介',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'简介/简介',
					]
				},
				{
					title: 'Web爬虫',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'Web爬虫/简介',
						'Web爬虫/^urllib',
						'Web爬虫/^requests',
					]
				},
				{
					title: '前端',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'前端/简介',
						'前端/HTML',
						'前端/CSS',
						'前端/JavaScript',
						'前端/DOM',
					]
				},
				{
					title: '前端框架',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'前端框架/Bootstrap',
						'前端框架/Node.js',
						'前端框架/Vue.js',
					]
				},
				{
					title: '后端',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'后端/简介',
						'后端/cookie',
						'后端/登录',
					]
				},
				{
					title: '后端服务器',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'后端服务器/Apache',
						'后端服务器/Tomcat',
						'后端服务器/Nginx',
						'后端服务器/FastDFS',
					]
				},
				{
					title: 'Web安全',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'Web安全/前端安全',
						'Web安全/后端安全',
						'Web安全/客户端安全',
					]
				},
				{
					title: 'CMS',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'CMS/简介',
						'CMS/Jekyll',
						'CMS/WordPress',
						'CMS/gitbook',
						'CMS/docsify',
						'CMS/VuePress',
					]
				},
			],
			'/DevOps/': [{
					title: '《DevOps》',
					path: '/DevOps/',
				},
				{
					title: '简介',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'简介/简介',
					]
				},
				{
					title: 'Dev工具',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'Dev工具/Git',
						'Dev工具/GitHub-Actions',
					]
				},
				{
					title: 'Jenkins',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'Jenkins/Jenkins',
						'Jenkins/Jenkinsfile',
						'Jenkins/^jenkinsapi',
					]
				},
				{
					title: 'Docker',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'Docker/简介',
						'Docker/容器',
						'Docker/镜像',
						'Docker/Docker-Compose',
					]
				},
				{
					title: 'k8s',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'k8s/简介',
						'k8s/安装',
						'k8s/Pod',
						'k8s/Network',
						'k8s/Volume',
						'k8s/插件',
						'k8s/Rancher',
					]
				},
				{
					title: '配置管理',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'配置管理/Ansible',
					]
				},
				{
					title: '监控告警',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'监控告警/简介',
						'监控告警/Supervisor',
						'监控告警/Grafana',
						'监控告警/Zabbix',
						'监控告警/Prometheus',
					]
				},
				{
					title: '日志处理',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'日志处理/logrotate',
						'日志处理/ELK',
					]
				},
				{
					title: '其它',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'其它/Nextcloud',
					]
				},
			],
			// '/  /': [{
			// 		title: '《  》',
			// 		path: '/  /',
			// 	},
			// 	{
			// 		title: '',
			// 		collapsable: true,
			// 		sidebarDepth: 2,
			// 		children: [
			// 			'',
			// 			'',
			// 			'',
			// 			'',
			// 			'',
			// 		]
			// 	},
			// ],
		},
		nextLinks: false,
		prevLinks: false,
	}
}