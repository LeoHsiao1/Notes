module.exports = {
	title: "LeoHsiao's Notes",
	description: ' ',
	host: '0.0.0.0',
	port: 80,
	base: '/',
	dest: 'docs/.vuepress/dist',
	lang: 'zh-CN',
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
						'混合开发/混合开发',
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
						'文件/处理文本',
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
						'网络/Socket',
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
					title: 'Linux原理',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'Linux原理/简介',
					]
				},
				{
					title: '其它',
					collapsable: true,
					sidebarDepth: 2,
					children: [
						'其它/系统信息',
						'其它/安装软件',
						'其它/插件工具',
						'其它/定时任务',
						'其它/gcc',
						'其它/OpenWrt',
					]
				},
			],
			// '/??/': [{
			// 		title: '《??》',
			// 		path: '/??/',
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