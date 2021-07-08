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
        extractHeaders: ['h1', 'h2', 'h3', 'h4'],
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
            text: "Notes",
            items: [
                {
                    text: "《编程》",
                    link: "/Programming/index"
                },
                {
                    text: "《Python》",
                    link: "/Python/index"
                },
                {
                    text: "《Linux》",
                    link: "/Linux/index"
                },
                {
                    text: "《计算机网络》",
                    link: "/Network/index"
                },
                {
                    text: "《Web》",
                    link: "/Web/index"
                },
                {
                    text: "《Database》",
                    link: "/Database/index"
                },
                {
                    text: "《DevOps》",
                    link: "/DevOps/index"
                },
                {
                    text: "《分布式》",
                    link: "/Distributed/index"
                }
            ]
        }],
        nextLinks: false,
        prevLinks: false,
        sidebarDepth: 0,
        sidebar: {
            "/Programming/": [
                {
                    title: "《编程》",
                    path: "/Programming/"
                },
                {
                    title: "编程语言",
                    children: [
                        {
                            title: "简介",
                            path: "编程语言/简介"
                        },
                        {
                            title: "Batch",
                            path: "编程语言/Batch"
                        },
                        {
                            title: "Golang",
                            path: "编程语言/Golang"
                        },
                        {
                            title: "Groovy",
                            path: "编程语言/Groovy"
                        },
                        {
                            title: "Lisp",
                            path: "编程语言/Lisp"
                        },
                        {
                            title: "Lua",
                            path: "编程语言/Lua"
                        },
                        {
                            title: "Perl",
                            path: "编程语言/Perl"
                        },
                        {
                            title: "PHP",
                            path: "编程语言/PHP"
                        },
                        {
                            title: "Ruby",
                            path: "编程语言/Ruby"
                        }
                    ]
                },
                {
                    title: "C",
                    children: [
                        {
                            title: "编译",
                            path: "C/编译"
                        }
                    ]
                },
                {
                    title: "Java",
                    children: [
                        {
                            title: "Java",
                            path: "Java/Java"
                        },
                        {
                            title: "构建",
                            path: "Java/构建"
                        },
                        {
                            title: "语法",
                            path: "Java/语法"
                        }
                    ]
                },
                {
                    title: "算法",
                    children: [
                        {
                            title: "哈希算法",
                            path: "算法/哈希算法"
                        },
                        {
                            title: "加密算法",
                            path: "算法/加密算法"
                        },
                        {
                            title: "图片相似算法",
                            path: "算法/图片相似算法"
                        }
                    ]
                }
            ],
            "/Python/": [
                {
                    title: "《Python》",
                    path: "/Python/"
                },
                {
                    title: "简介",
                    children: [
                        {
                            title: "Python",
                            path: "简介/Python"
                        },
                        {
                            title: "解释器",
                            path: "简介/解释器"
                        },
                        {
                            title: "版本",
                            path: "简介/版本"
                        }
                    ]
                },
                {
                    title: "模块与包",
                    children: [
                        {
                            title: "模块与包",
                            path: "模块与包/模块与包"
                        },
                        {
                            title: "代码库",
                            path: "模块与包/代码库"
                        }
                    ]
                },
                {
                    title: "文件处理",
                    children: [
                        {
                            title: "文件对象",
                            path: "文件处理/文件对象"
                        },
                        {
                            title: "♢ io",
                            path: "文件处理/io"
                        },
                        {
                            title: "♢ logging",
                            path: "文件处理/logging"
                        }
                    ]
                },
                {
                    title: "文本处理",
                    children: [
                        {
                            title: "文本",
                            path: "文本处理/文本"
                        },
                        {
                            title: "字节编码",
                            path: "文本处理/字节编码"
                        },
                        {
                            title: "字符编码",
                            path: "文本处理/字符编码"
                        },
                        {
                            title: "INI",
                            path: "文本处理/INI"
                        },
                        {
                            title: "XML",
                            path: "文本处理/XML"
                        },
                        {
                            title: "Jinja",
                            path: "文本处理/Jinja"
                        },
                        {
                            title: "字符串匹配",
                            path: "文本处理/字符串匹配"
                        }
                    ]
                },
                {
                    title: "数学运算",
                    children: [
                        {
                            title: "♢ random",
                            path: "数学运算/random"
                        },
                        {
                            title: "♢ decimal",
                            path: "数学运算/decimal"
                        },
                        {
                            title: "♢ math",
                            path: "数学运算/math"
                        },
                        {
                            title: "♢ numpy",
                            path: "数学运算/numpy"
                        }
                    ]
                },
                {
                    title: "图像处理",
                    children: [
                        {
                            title: "电子图片",
                            path: "图像处理/电子图片"
                        },
                        {
                            title: "♢ Pillow",
                            path: "图像处理/Pillow"
                        },
                        {
                            title: "♢ Matplotlib",
                            path: "图像处理/Matplotlib"
                        },
                        {
                            title: "♢ NetworkX",
                            path: "图像处理/NetworkX"
                        },
                        {
                            title: "♢ pyecharts",
                            path: "图像处理/pyecharts"
                        }
                    ]
                },
                {
                    title: "网络通信",
                    children: [
                        {
                            title: "Email",
                            path: "网络通信/Email"
                        },
                        {
                            title: "♢ http",
                            path: "网络通信/http"
                        },
                        {
                            title: "♢ urllib",
                            path: "网络通信/urllib"
                        },
                        {
                            title: "♢ requests",
                            path: "网络通信/requests"
                        }
                    ]
                },
                {
                    title: "混合开发",
                    children: [
                        {
                            title: "简介",
                            path: "混合开发/简介"
                        },
                        {
                            title: "♢ ctypes",
                            path: "混合开发/ctypes"
                        },
                        {
                            title: "♢ Cython",
                            path: "混合开发/Cython"
                        },
                        {
                            title: "♢ pybind11",
                            path: "混合开发/pybind11"
                        },
                        {
                            title: "SWIG",
                            path: "混合开发/SWIG"
                        }
                    ]
                }
            ],
            "/Linux/": [
                {
                    title: "《Linux》",
                    path: "/Linux/"
                },
                {
                    title: "简介",
                    children: [
                        {
                            title: "简介",
                            path: "简介/Linux"
                        },
                        {
                            title: "发行版",
                            path: "简介/发行版"
                        },
                        {
                            title: "相关概念",
                            path: "简介/相关概念"
                        }
                    ]
                },
                {
                    title: "终端",
                    children: [
                        {
                            title: "终端",
                            path: "终端/终端"
                        },
                        {
                            title: "命令",
                            path: "终端/命令"
                        },
                        {
                            title: "登录",
                            path: "终端/登录"
                        },
                        {
                            title: "用户",
                            path: "终端/用户"
                        }
                    ]
                },
                {
                    title: "进程",
                    children: [
                        {
                            title: "进程",
                            path: "进程/进程"
                        },
                        {
                            title: "线程",
                            path: "进程/线程"
                        },
                        {
                            title: "进程通信",
                            path: "进程/进程通信"
                        },
                        {
                            title: "管理进程",
                            path: "进程/管理进程"
                        }
                    ]
                },
                {
                    title: "文件",
                    children: [
                        {
                            title: "文件",
                            path: "文件/文件"
                        },
                        {
                            title: "文件处理",
                            path: "文件/文件处理"
                        },
                        {
                            title: "文本处理",
                            path: "文件/文本处理"
                        },
                        {
                            title: "文件属性",
                            path: "文件/文件属性"
                        },
                        {
                            title: "文件权限",
                            path: "文件/文件权限"
                        },
                        {
                            title: "目录",
                            path: "文件/目录"
                        }
                    ]
                },
                {
                    title: "设备",
                    children: [
                        {
                            title: "设备",
                            path: "设备/设备"
                        },
                        {
                            title: "CPU",
                            path: "设备/CPU"
                        },
                        {
                            title: "内存",
                            path: "设备/内存"
                        },
                        {
                            title: "外存",
                            path: "设备/外存"
                        },
                        {
                            title: "磁盘分区",
                            path: "设备/磁盘分区"
                        }
                    ]
                },
                {
                    title: "网络",
                    children: [
                        {
                            title: "IP",
                            path: "网络/IP"
                        },
                        {
                            title: "DNS",
                            path: "网络/DNS"
                        },
                        {
                            title: "Socket",
                            path: "网络/Socket"
                        },
                        {
                            title: "防火墙",
                            path: "网络/防火墙"
                        },
                        {
                            title: "SSH",
                            path: "网络/SSH"
                        },
                        {
                            title: "FTP",
                            path: "网络/FTP"
                        },
                        {
                            title: "HTTP",
                            path: "网络/HTTP"
                        },
                        {
                            title: "网络代理",
                            path: "网络/网络代理"
                        }
                    ]
                },
                {
                    title: "测试",
                    children: [
                        {
                            title: "简介",
                            path: "测试/简介"
                        },
                        {
                            title: "进程测试",
                            path: "测试/进程测试"
                        },
                        {
                            title: "网络测试",
                            path: "测试/网络测试"
                        },
                        {
                            title: "综合测试",
                            path: "测试/综合测试"
                        }
                    ]
                },
                {
                    title: "Shell",
                    children: [
                        {
                            title: "Shell",
                            path: "Shell/Shell"
                        },
                        {
                            title: "变量",
                            path: "Shell/变量"
                        },
                        {
                            title: "流程控制",
                            path: "Shell/流程控制"
                        }
                    ]
                },
                {
                    title: "系统内核",
                    children: [
                        {
                            title: "简介",
                            path: "系统内核/简介"
                        },
                        {
                            title: "开机",
                            path: "系统内核/开机"
                        },
                        {
                            title: "内核参数",
                            path: "系统内核/内核参数"
                        }
                    ]
                },
                {
                    title: "其它",
                    children: [
                        {
                            title: "系统信息",
                            path: "其它/系统信息"
                        },
                        {
                            title: "安装软件",
                            path: "其它/安装软件"
                        },
                        {
                            title: "日志",
                            path: "其它/日志"
                        },
                        {
                            title: "时间",
                            path: "其它/时间"
                        },
                        {
                            title: "定时任务",
                            path: "其它/定时任务"
                        },
                        {
                            title: "OpenWrt",
                            path: "其它/OpenWrt"
                        }
                    ]
                }
            ],
            "/Network/": [
                {
                    title: "《计算机网络》",
                    path: "/Network/"
                },
                {
                    title: "计算机网络",
                    children: [
                        {
                            title: "简介",
                            path: "计算机网络/简介"
                        },
                        {
                            title: "通信线路",
                            path: "计算机网络/通信线路"
                        },
                        {
                            title: "数据编码",
                            path: "计算机网络/数据编码"
                        },
                        {
                            title: "数据传输",
                            path: "计算机网络/数据传输"
                        },
                        {
                            title: "覆盖范围",
                            path: "计算机网络/覆盖范围"
                        }
                    ]
                },
                {
                    title: "网络设备",
                    children: [
                        {
                            title: "简介",
                            path: "网络设备/简介"
                        },
                        {
                            title: "交换机",
                            path: "网络设备/交换机"
                        },
                        {
                            title: "路由器",
                            path: "网络设备/路由器"
                        }
                    ]
                },
                {
                    title: "网络协议",
                    children: [
                        {
                            title: "简介",
                            path: "网络协议/简介"
                        },
                        {
                            title: "网络体系结构",
                            path: "网络协议/网络体系结构"
                        },
                        {
                            title: "IP",
                            path: "网络协议/IP"
                        },
                        {
                            title: "DNS",
                            path: "网络协议/DNS"
                        },
                        {
                            title: "TCP/UDP",
                            path: "网络协议/TCP-UDP"
                        },
                        {
                            title: "Socket",
                            path: "网络协议/Socket"
                        },
                        {
                            title: "HTTP",
                            path: "网络协议/HTTP"
                        },
                        {
                            title: "MQTT",
                            path: "网络协议/MQTT"
                        }
                    ]
                },
                {
                    title: "计算机安全",
                    children: [
                        {
                            title: "恶意代码",
                            path: "计算机安全/恶意代码"
                        },
                        {
                            title: "网络安全",
                            path: "计算机安全/网络安全"
                        }
                    ]
                }
            ],
            "/Web/": [
                {
                    title: "《Web》",
                    path: "/Web/"
                },
                {
                    title: "简介",
                    children: [
                        {
                            title: "Web技术",
                            path: "简介/Web技术"
                        },
                        {
                            title: "Web爬虫",
                            path: "简介/Web爬虫"
                        },
                        {
                            title: "Web安全",
                            path: "简介/Web安全"
                        }
                    ]
                },
                {
                    title: "前端",
                    children: [
                        {
                            title: "简介",
                            path: "前端/简介"
                        },
                        {
                            title: "HTML",
                            path: "前端/HTML"
                        },
                        {
                            title: "CSS",
                            path: "前端/CSS"
                        },
                        {
                            title: "JavaScript",
                            path: "前端/JavaScript"
                        },
                        {
                            title: "TypeScript",
                            path: "前端/TypeScript"
                        },
                        {
                            title: "前端构建",
                            path: "前端/前端构建"
                        },
                        {
                            title: "Bootstrap",
                            path: "前端/Bootstrap"
                        },
                        {
                            title: "Vue.js",
                            path: "前端/Vue.js"
                        }
                    ]
                },
                {
                    title: "后端",
                    children: [
                        {
                            title: "后端框架",
                            path: "后端/后端框架"
                        },
                        {
                            title: "通信协议",
                            path: "后端/通信协议"
                        },
                        {
                            title: "cookie",
                            path: "后端/cookie"
                        },
                        {
                            title: "身份验证",
                            path: "后端/身份验证"
                        }
                    ]
                },
                {
                    title: "Web服务器",
                    children: [
                        {
                            title: "简介",
                            path: "Web服务器/简介"
                        },
                        {
                            title: "Nginx",
                            path: "Web服务器/Nginx"
                        },
                        {
                            title: "Tomcat",
                            path: "Web服务器/Tomcat"
                        }
                    ]
                },
                {
                    title: "CMS",
                    children: [
                        {
                            title: "简介",
                            path: "CMS/简介"
                        },
                        {
                            title: "Jekyll",
                            path: "CMS/Jekyll"
                        },
                        {
                            title: "WordPress",
                            path: "CMS/WordPress"
                        },
                        {
                            title: "gitbook",
                            path: "CMS/gitbook"
                        },
                        {
                            title: "docsify",
                            path: "CMS/docsify"
                        },
                        {
                            title: "VuePress",
                            path: "CMS/VuePress"
                        }
                    ]
                }
            ],
            "/Database/": [
                {
                    title: "《Database》",
                    path: "/Database/"
                },
                {
                    title: "简介",
                    children: [
                        {
                            title: "数据库",
                            path: "简介/数据库"
                        },
                        {
                            title: "事务",
                            path: "简介/事务"
                        }
                    ]
                },
                {
                    title: "SQLite",
                    children: [
                        {
                            title: "SQLite",
                            path: "SQLite/SQLite"
                        },
                        {
                            title: "♢ sqlite3",
                            path: "SQLite/sqlite3"
                        }
                    ]
                },
                {
                    title: "MySQL",
                    children: [
                        {
                            title: "MySQL",
                            path: "MySQL/MySQL"
                        },
                        {
                            title: "部署",
                            path: "MySQL/部署"
                        },
                        {
                            title: "配置",
                            path: "MySQL/配置"
                        },
                        {
                            title: "管理单元",
                            path: "MySQL/管理单元"
                        },
                        {
                            title: "数据类型",
                            path: "MySQL/数据类型"
                        },
                        {
                            title: "函数",
                            path: "MySQL/函数"
                        },
                        {
                            title: "存储引擎",
                            path: "MySQL/存储引擎"
                        },
                        {
                            title: "性能优化",
                            path: "MySQL/性能优化"
                        },
                        {
                            title: "♢ PyMySQL",
                            path: "MySQL/PyMySQL"
                        },
                        {
                            title: "♢ SQLAlchemy",
                            path: "MySQL/SQLAlchemy"
                        }
                    ]
                },
                {
                    title: "MongoDB",
                    children: [
                        {
                            title: "MongoDB",
                            path: "MongoDB/MongoDB"
                        },
                        {
                            title: "部署",
                            path: "MongoDB/部署"
                        },
                        {
                            title: "配置",
                            path: "MongoDB/配置"
                        },
                        {
                            title: "管理单元",
                            path: "MongoDB/管理单元"
                        },
                        {
                            title: "性能优化",
                            path: "MongoDB/性能优化"
                        },
                        {
                            title: "♢ pymongo",
                            path: "MongoDB/pymongo"
                        }
                    ]
                },
                {
                    title: "Redis",
                    children: [
                        {
                            title: "Redis",
                            path: "Redis/Redis"
                        },
                        {
                            title: "部署",
                            path: "Redis/部署"
                        },
                        {
                            title: "配置",
                            path: "Redis/配置"
                        },
                        {
                            title: "管理单元",
                            path: "Redis/管理单元"
                        },
                        {
                            title: "数据类型",
                            path: "Redis/数据类型"
                        },
                        {
                            title: "其它功能",
                            path: "Redis/其它功能"
                        },
                        {
                            title: "性能优化",
                            path: "Redis/性能优化"
                        },
                        {
                            title: "♢ redis",
                            path: "Redis/redis-py"
                        }
                    ]
                },
                {
                    title: "ES",
                    children: [
                        {
                            title: "ElasticSearch",
                            path: "ES/ElasticSearch"
                        },
                        {
                            title: "部署",
                            path: "ES/部署"
                        },
                        {
                            title: "管理单元",
                            path: "ES/管理单元"
                        },
                        {
                            title: "查询",
                            path: "ES/查询"
                        },
                        {
                            title: "配置",
                            path: "ES/配置"
                        }
                    ]
                },
                {
                    title: "LDAP",
                    children: [
                        {
                            title: "LDAP",
                            path: "LDAP/LDAP"
                        },
                        {
                            title: "OpenLDAP",
                            path: "LDAP/OpenLDAP"
                        },
                        {
                            title: "LdapAdmin",
                            path: "LDAP/LdapAdmin"
                        }
                    ]
                }
            ],
            "/DevOps/": [
                {
                    title: "《DevOps》",
                    path: "/DevOps/"
                },
                {
                    title: "CI",
                    children: [
                        {
                            title: "Git",
                            path: "CI/Git"
                        },
                        {
                            title: "GitLab",
                            path: "CI/GitLab"
                        },
                        {
                            title: "GitHub",
                            path: "CI/GitHub"
                        },
                        {
                            title: "Jenkins",
                            path: "CI/Jenkins"
                        },
                        {
                            title: "Jenkinsfile",
                            path: "CI/Jenkinsfile"
                        }
                    ]
                },
                {
                    title: "容器",
                    children: [
                        {
                            title: "简介",
                            path: "容器/简介"
                        },
                        {
                            title: "Docker",
                            path: "容器/Docker"
                        },
                        {
                            title: "Docker 容器",
                            path: "容器/Docker容器"
                        },
                        {
                            title: "Docker 镜像",
                            path: "容器/Docker镜像"
                        },
                        {
                            title: "Dockerfile",
                            path: "容器/Dockerfile"
                        },
                        {
                            title: "Docker Compose",
                            path: "容器/Docker-Compose"
                        }
                    ]
                },
                {
                    title: "k8s",
                    children: [
                        {
                            title: "Kubernetes",
                            path: "k8s/Kubernetes"
                        },
                        {
                            title: "安装",
                            path: "k8s/安装"
                        },
                        {
                            title: "Pod",
                            path: "k8s/Pod"
                        },
                        {
                            title: "Network",
                            path: "k8s/Network"
                        },
                        {
                            title: "Volume",
                            path: "k8s/Volume"
                        },
                        {
                            title: "插件",
                            path: "k8s/插件"
                        },
                        {
                            title: "Rancher",
                            path: "k8s/Rancher"
                        }
                    ]
                },
                {
                    title: "配置管理",
                    children: [
                        {
                            title: "简介",
                            path: "配置管理/简介"
                        },
                        {
                            title: "Ansible",
                            path: "配置管理/Ansible"
                        },
                        {
                            title: "Jumpserver",
                            path: "配置管理/Jumpserver"
                        },
                        {
                            title: "Supervisor",
                            path: "配置管理/Supervisor"
                        },
                        {
                            title: "Nacos",
                            path: "配置管理/Nacos"
                        },
                        {
                            title: "Artifactory",
                            path: "配置管理/Artifactory"
                        },
                        {
                            title: "Harbor",
                            path: "配置管理/Harbor"
                        }
                    ]
                },
                {
                    title: "监控告警",
                    children: [
                        {
                            title: "简介",
                            path: "监控告警/简介"
                        },
                        {
                            title: "Grafana",
                            path: "监控告警/Grafana"
                        },
                        {
                            title: "Zabbix",
                            path: "监控告警/Zabbix"
                        }
                    ]
                },
                {
                    title: "Prometheus",
                    children: [
                        {
                            title: "Prometheus",
                            path: "Prometheus/Prometheus"
                        },
                        {
                            title: "exporter",
                            path: "Prometheus/exporter"
                        },
                        {
                            title: "Pushgateway",
                            path: "Prometheus/Pushgateway"
                        },
                        {
                            title: "Alertmanager",
                            path: "Prometheus/Alertmanager"
                        }
                    ]
                },
                {
                    title: "ELK",
                    children: [
                        {
                            title: "ELK",
                            path: "ELK/ELK"
                        },
                        {
                            title: "Kibana",
                            path: "ELK/Kibana"
                        },
                        {
                            title: "Beats",
                            path: "ELK/Beats"
                        },
                        {
                            title: "Logstash",
                            path: "ELK/Logstash"
                        },
                        {
                            title: "Open Distro",
                            path: "ELK/OpenDistro"
                        }
                    ]
                },
                {
                    title: "其它",
                    children: [
                        {
                            title: "VS Code",
                            path: "其它/VSCode"
                        },
                        {
                            title: "SonarQube",
                            path: "其它/SonarQube"
                        }
                    ]
                }
            ],
            "/Distributed/": [
                {
                    title: "《分布式》",
                    path: "/Distributed/"
                },
                {
                    title: "简介",
                    children: [
                        {
                            title: "云计算",
                            path: "简介/云计算"
                        },
                        {
                            title: "微服务",
                            path: "简介/微服务"
                        },
                        {
                            title: "大数据",
                            path: "简介/大数据"
                        }
                    ]
                },
                {
                    title: "分布式系统",
                    children: [
                        {
                            title: "简介",
                            path: "分布式系统/简介"
                        },
                        {
                            title: "ZooKeeper",
                            path: "分布式系统/ZooKeeper"
                        },
                        {
                            title: "Zipkin",
                            path: "分布式系统/Zipkin"
                        }
                    ]
                },
                {
                    title: "消息队列",
                    children: [
                        {
                            title: "简介",
                            path: "消息队列/简介"
                        },
                        {
                            title: "ActiveMQ",
                            path: "消息队列/ActiveMQ"
                        },
                        {
                            title: "Kafka",
                            path: "消息队列/Kafka"
                        }
                    ]
                },
                {
                    title: "存储",
                    children: [
                        {
                            title: "简介",
                            path: "存储/简介"
                        },
                        {
                            title: "FastDFS",
                            path: "存储/FastDFS"
                        },
                        {
                            title: "go-fastdfs",
                            path: "存储/go-fastdfs"
                        },
                        {
                            title: "MinIO",
                            path: "存储/MinIO"
                        },
                        {
                            title: "Nextcloud",
                            path: "存储/Nextcloud"
                        },
                        {
                            title: "h5ai",
                            path: "存储/h5ai"
                        }
                    ]
                }
            ]
        }
    }
}
