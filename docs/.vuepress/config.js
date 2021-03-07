module.exports = {
    title: "LeoHsiao's Notes",
    description: ' ',
    host: '0.0.0.0',
    port: 80,
    base: '/',
    dest: 'docs/.vuepress/dist',
    lang: 'zh-CN',
    plugins: [
        ['sitemap', {
            hostname: 'http://leohsiao.com'
        }],
        ['@vuepress/google-analytics', {
            'ga': 'UA-155748502-1'
        }],
        ['vuepress-plugin-meilisearch',
            {
                hostUrl: 'http://leohsiao.com:7700',
                apiKey: '57557c7907388a064d88e127e15ac43ce01f9fcb2fb07321d3f3c4ff14d66f92',
                indexUid: 'docs',
                placeholder: '',
                maxSuggestions: 5,
                cropLength: 50,
            },
        ],
        ['vuepress-plugin-right-anchor',
            {
                expand: {
                    default: true,
                    trigger: 'click',
                },
                customClass: 'right-anchor',
            }
        ],
        [
            'vuepress-plugin-zooming',
            {
                options: {
                    bgColor: 'rgb(0, 0, 0)',
                    bgOpacity: 0.5,
                    scaleBase: 0.9,
                    transitionDuration: 0.2,
                },
            },
        ],
    ],
    markdown: {
        extractHeaders: [ 'h1', 'h2', 'h3'],
    },
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
            items: [
                {
                    text: '《编程》',
                    link: '/Programming/index'
                },
                {
                    text: '《Python》',
                    link: '/Python/index'
                },
                {
                    text: '《Linux》',
                    link: '/Linux/index'
                },
                {
                    text: '《计算机网络》',
                    link: '/Network/index'
                },
                {
                    text: '《Web》',
                    link: '/Web/index'
                },
                {
                    text: '《Database》',
                    link: '/Database/index'
                },
                {
                    text: '《DevOps》',
                    link: '/DevOps/index'
                },
                {
                    text: '《分布式》',
                    link: '/Distributed/index'
                },
            ]
        }],
        sidebarDepth: 0,
        sidebar: {
            '/Programming/': [{
                    title: '《编程》',
                    path: '/Programming/',
                },
                {
                    title: '编程语言',
                    children: [
                        '编程语言/简介',
                        '编程语言/Batch',
                        '编程语言/Golang',
                        '编程语言/Groovy',
                        '编程语言/Lisp',
                        '编程语言/Lua',
                        '编程语言/Perl',
                        '编程语言/PHP',
                        '编程语言/Ruby',
                    ]
                },
                {
                    title: 'C',
                    children: [
                        'C/编译',
                    ]
                },
                {
                    title: 'Java',
                    children: [
                        'Java/Java',
                        'Java/编译',
                        'Java/语法',
                    ]
                },
                {
                    title: '算法',
                    children: [
                        '算法/哈希算法',
                        '算法/加密算法',
                        '算法/图片相似算法',
                    ]
                },
            ],
            '/Python/': [{
                    title: '《Python》',
                    path: '/Python/',
                },
                {
                    title: '简介',
                    children: [
                        '简介/Python',
                        '简介/解释器',
                        '简介/版本',
                    ]
                },
                {
                    title: '模块与包',
                    children: [
                        '模块与包/模块与包',
                        '模块与包/代码库',
                    ]
                },
                {
                    title: '文本处理',
                    children: [
                        '文本处理/打开文件',
                        '文本处理/INI',
                        '文本处理/XML',
                        '文本处理/Jinja',
                    ]
                },
                {
                    title: '数学运算',
                    children: [
                        '数学运算/random',
                        '数学运算/decimal',
                        '数学运算/math',
                        '数学运算/numpy',
                    ]
                },
                {
                    title: '图像处理',
                    children: [
                        '图像处理/电子图片',
                        '图像处理/Pillow',
                        '图像处理/Matplotlib',
                        '图像处理/NetworkX',
                        '图像处理/pyecharts',
                    ]
                },
                {
                    title: '网络通信',
                    children: [
                        '网络通信/Email',
                        '网络通信/http',
                        '网络通信/urllib',
                        '网络通信/requests',
                    ]
                },
                {
                    title: '混合开发',
                    children: [
                        '混合开发/简介',
                        '混合开发/ctypes',
                        '混合开发/Cython',
                        '混合开发/pybind11',
                        '混合开发/SWIG',
                    ]
                },
            ],
            '/Linux/': [{
                    title: '《Linux》',
                    path: '/Linux/',
                },
                {
                    title: '简介',
                    children: [
                        '简介/Linux',
                        '简介/发行版',
                        '简介/相关概念',
                    ]
                },
                {
                    title: '终端',
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
                    children: [
                        '进程/进程',
                        '进程/管理进程',
                    ]
                },
                {
                    title: '文件',
                    children: [
                        '文件/文件',
                        '文件/文件处理',
                        '文件/文本处理',
                        '文件/文件属性',
                        '文件/文件权限',
                        '文件/目录',
                    ]
                },
                {
                    title: '设备',
                    children: [
                        '设备/设备',
                        '设备/CPU',
                        '设备/内存',
                        '设备/外存',
                        '设备/磁盘分区',
                    ]
                },
                {
                    title: '网络',
                    children: [
                        '网络/IP',
                        '网络/DNS',
                        '网络/Socket',
                        '网络/防火墙',
                        '网络/SSH',
                        '网络/FTP',
                        '网络/HTTP',
                        '网络/网络代理',
                    ]
                },
                {
                    title: '测试',
                    children: [
                        '测试/简介',
                        '测试/网络测试',
                        '测试/综合测试',
                    ]
                },
                {
                    title: 'Shell',
                    children: [
                        'Shell/Shell',
                        'Shell/变量',
                        'Shell/流程控制',
                        'Shell/脚本示例',
                    ]
                },
                {
                    title: '内核',
                    children: [
                        '内核/简介',
                        '内核/内核参数',
                    ]
                },
                {
                    title: '其它',
                    children: [
                        '其它/系统信息',
                        '其它/安装软件',
                        '其它/时间',
                        '其它/定时任务',
                        '其它/日志',
                        '其它/OpenWrt',
                    ]
                },
            ],
            '/Network/': [{
                    title: '《计算机网络》',
                    path: '/Network/',
                },
                {
                    title: '计算机网络',
                    children: [
                        '计算机网络/简介',
                        '计算机网络/通信线路',
                        '计算机网络/数据编码',
                        '计算机网络/数据传输',
                        '计算机网络/覆盖范围',
                    ]
                },
                {
                    title: '网络设备',
                    children: [
                        '网络设备/简介',
                        '网络设备/交换机',
                        '网络设备/路由器',
                    ]
                },
                {
                    title: '网络协议',
                    children: [
                        '网络协议/简介',
                        '网络协议/网络体系结构',
                        '网络协议/IP',
                        '网络协议/DNS',
                        '网络协议/TCP-UDP',
                        '网络协议/Socket',
                        '网络协议/HTTP',
                        '网络协议/MQTT',
                    ]
                },
                {
                    title: '计算机安全',
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
                    children: [
                        '简介/Web技术',
                        '简介/Web爬虫',
                    ]
                },
                {
                    title: '前端',
                    children: [
                        '前端/简介',
                        '前端/HTML',
                        '前端/CSS',
                        '前端/JavaScript',
                        '前端/TypeScript',
                    ]
                },
                {
                    title: '前端框架',
                    children: [
                        '前端框架/Bootstrap',
                        '前端框架/Node.js',
                        '前端框架/Vue.js',
                    ]
                },
                {
                    title: '后端',
                    children: [
                        '后端/通信协议',
                        '后端/cookie',
                        '后端/身份验证',
                    ]
                },
                {
                    title: 'Web服务器',
                    children: [
                        'Web服务器/简介',
                        'Web服务器/Apache',
                        'Web服务器/Tomcat',
                        'Web服务器/Nginx',
                    ]
                },
                {
                    title: 'Web安全',
                    children: [
                        'Web安全/服务器安全',
                        'Web安全/客户端安全',
                    ]
                },
                {
                    title: 'CMS',
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
            '/Database/': [{
                    title: '《Database》',
                    path: '/Database/',
                },
                {
                    title: '简介',
                    children: [
                        '简介/数据库',
                        '简介/事务',
                    ]
                },
                {
                    title: 'SQLite',
                    children: [
                        'SQLite/SQLite',
                        'SQLite/sqlite3',
                    ]
                },
                {
                    title: 'MySQL',
                    children: [
                        'MySQL/MySQL',
                        'MySQL/部署',
                        'MySQL/配置',
                        'MySQL/访问权限',
                        'MySQL/管理单元',
                        'MySQL/数据类型',
                        'MySQL/函数',
                        'MySQL/存储引擎',
                        'MySQL/备份数据',
                        'MySQL/性能优化',
                        'MySQL/PyMySQL',
                        'MySQL/SQLAlchemy',
                    ]
                },
                {
                    title: 'MongoDB',
                    children: [
                        'MongoDB/MongoDB',
                        'MongoDB/部署',
                        'MongoDB/访问权限',
                        'MongoDB/管理单元',
                        'MongoDB/其它功能',
                        'MongoDB/性能优化',
                        'MongoDB/pymongo',
                    ]
                },
                {
                    title: 'Redis',
                    children: [
                        'Redis/Redis',
                        'Redis/部署',
                        'Redis/管理单元',
                        'Redis/数据类型',
                        'Redis/其它功能',
                        'Redis/性能优化',
                        'Redis/redis-py',
                    ]
                },
                {
                    title: 'ES',
                    children: [
                        'ES/ElasticSearch',
                        'ES/部署',
                        'ES/管理单元',
                        'ES/查询',
                    ]
                },
                {
                    title: 'LDAP',
                    children: [
                        'LDAP/LDAP',
                        'LDAP/OpenLDAP',
                        'LDAP/LdapAdmin',
                    ]
                },
            ],
            '/DevOps/': [{
                    title: '《DevOps》',
                    path: '/DevOps/',
                },
                {
                    title: 'CI',
                    children: [
                        'CI/Git',
                        'CI/GitLab',
                        'CI/GitHub',
                        'CI/Jenkins',
                    ]
                },
                {
                    title: '容器',
                    children: [
                        '容器/简介',
                        '容器/Docker',
                        '容器/Dockerfile',
                        '容器/Docker-Compose',
                    ]
                },
                {
                    title: 'k8s',
                    children: [
                        'k8s/Kubernetes',
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
                    children: [
                        '配置管理/简介',
                        '配置管理/Ansible',
                        '配置管理/Jumpserver',
                        '配置管理/Supervisor',
                        '配置管理/Nacos',
                    ]
                },
                {
                    title: '监控告警',
                    children: [
                        '监控告警/简介',
                        '监控告警/Grafana',
                        '监控告警/Zabbix',
                    ]
                },
                {
                    title: 'Prometheus',
                    children: [
                        'Prometheus/Prometheus',
                        'Prometheus/exporter',
                        'Prometheus/Pushgateway',
                        'Prometheus/Alertmanager',
                    ]
                },
                {
                    title: 'ELK',
                    children: [
                        'ELK/ELK',
                        'ELK/Kibana',
                        'ELK/Beats',
                        'ELK/Logstash',
                        'ELK/OpenDistro',
                    ]
                },
                {
                    title: '其它',
                    children: [
                        '其它/VSCode',
                        '其它/SonarQube',
                    ]
                },
            ],
            '/Distributed/': [{
                    title: '《分布式》',
                    path: '/Distributed/',
                },
                {
                    title: '简介',
                    children: [
                        '简介/云计算',
                        '简介/微服务',
                        '简介/大数据',
                    ]
                },
                {
                    title: '分布式系统',
                    children: [
                        '分布式系统/简介',
                        '分布式系统/ZooKeeper',
                    ]
                },
                {
                    title: '消息队列',
                    children: [
                        '消息队列/简介',
                        '消息队列/ActiveMQ',
                        '消息队列/Kafka',
                    ]
                },
                {
                    title: '存储',
                    children: [
                        '存储/简介',
                        '存储/FastDFS',
                        '存储/go-fastdfs',
                        '存储/MinIO',
                        '存储/Artifactory',
                        '存储/Nextcloud',
                        '存储/h5ai',
                    ]
                },
            ],
        },
        nextLinks: false,
        prevLinks: false,
    }
}