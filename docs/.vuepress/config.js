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
            hostname: 'https://leohsiao.com'
        }],
        ['seo', {}],
        ['@vuepress/google-analytics', {
            'ga': 'UA-155748502-1'
        }],
        ['vuepress-plugin-meilisearch',
            {
                hostUrl: 'https://meilisearch.leohsiao.com',
                apiKey: 'X9UsPpbPe6ed532b8c3f8cfaf8cdcaa2fb0ff3e6637da4303eb6505c81f46ec7d859dc09',
                indexUid: 'docs',
                placeholder: '',
                maxSuggestions: 6,
                cropLength: 50,
            }
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
        ['vuepress-plugin-zooming',
            {
                options: {
                    bgColor: 'rgb(0, 0, 0)',
                    bgOpacity: 0.5,
                    scaleBase: 0.9,
                    transitionDuration: 0.2,
                }
            }
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
                    text: "《容器》",
                    link: "/Container/index"
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
                            path: "/Programming/language/简介"
                        },
                        {
                            title: "Batch",
                            path: "/Programming/language/Batch"
                        },
                        {
                            title: "C",
                            collapsable: false,
                            children: [
                                {
                                    title: "编译",
                                    path: "/Programming/language/C/编译"
                                }
                            ]
                        },
                        {
                            title: "Golang",
                            path: "/Programming/language/Golang"
                        },
                        {
                            title: "Groovy",
                            path: "/Programming/language/Groovy"
                        },
                        {
                            title: "Java",
                            path: "/Programming/language/Java/Java",
                            collapsable: false,
                            children: [
                                {
                                    title: "构建",
                                    path: "/Programming/language/Java/构建"
                                },
                                {
                                    title: "语法",
                                    path: "/Programming/language/Java/语法"
                                },
                                {
                                    title: "GC",
                                    path: "/Programming/language/Java/GC"
                                }
                            ]
                        },
                        {
                            title: "Lisp",
                            path: "/Programming/language/Lisp"
                        },
                        {
                            title: "Lua",
                            path: "/Programming/language/Lua"
                        },
                        {
                            title: "Python",
                            path: "https://leohsiao.com/Python/"
                        },
                        {
                            title: "Perl",
                            path: "/Programming/language/Perl"
                        },
                        {
                            title: "PHP",
                            path: "/Programming/language/PHP"
                        },
                        {
                            title: "Ruby",
                            path: "/Programming/language/Ruby"
                        }
                    ]
                },
                {
                    title: "算法",
                    children: [
                        {
                            title: "哈希算法",
                            path: "/Programming/algorithm/哈希算法"
                        },
                        {
                            title: "加密算法",
                            path: "/Programming/algorithm/加密算法"
                        },
                        {
                            title: "图片相似算法",
                            path: "/Programming/algorithm/图片相似算法"
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
                            path: "/Python/简介/Python"
                        },
                        {
                            title: "解释器",
                            path: "/Python/简介/解释器"
                        },
                        {
                            title: "版本",
                            path: "/Python/简介/版本"
                        }
                    ]
                },
                {
                    title: "模块与包",
                    children: [
                        {
                            title: "模块与包",
                            path: "/Python/模块与包/模块与包"
                        },
                        {
                            title: "软件包",
                            path: "/Python/模块与包/软件包"
                        }
                    ]
                },
                {
                    title: "文件处理",
                    children: [
                        {
                            title: "文件对象",
                            path: "/Python/文件处理/文件对象"
                        },
                        {
                            title: "♢ io",
                            path: "/Python/文件处理/io"
                        },
                        {
                            title: "♢ logging",
                            path: "/Python/文件处理/logging"
                        }
                    ]
                },
                {
                    title: "文本处理",
                    children: [
                        {
                            title: "字节编码",
                            path: "/Python/文本处理/字节编码"
                        },
                        {
                            title: "字符编码",
                            path: "/Python/文本处理/字符编码"
                        },
                        {
                            title: "序列化",
                            path: "/Python/文本处理/序列化/序列化",
                            collapsable: false,
                            children: [
                                {
                                    title: "INI",
                                    path: "/Python/文本处理/序列化/INI"
                                },
                                {
                                    title: "XML",
                                    path: "/Python/文本处理/序列化/XML"
                                },
                                {
                                    title: "JSON",
                                    path: "/Python/文本处理/序列化/JSON"
                                },
                                {
                                    title: "YAML",
                                    path: "/Python/文本处理/序列化/YAML"
                                },
                                {
                                    title: "pickle",
                                    path: "/Python/文本处理/序列化/pickle"
                                },
                                {
                                    title: "ProtoBuf",
                                    path: "/Python/文本处理/序列化/ProtoBuf"
                                },
                                {
                                    title: "Jinja",
                                    path: "/Python/文本处理/序列化/Jinja"
                                },
                                {
                                    title: "Markdown",
                                    path: "/Python/文本处理/序列化/Markdown"
                                }
                            ]
                        },
                        {
                            title: "字符串匹配",
                            path: "/Python/文本处理/字符串匹配/字符串匹配",
                            collapsable: false,
                            children: [
                                {
                                    title: "通配符",
                                    path: "/Python/文本处理/字符串匹配/通配符"
                                },
                                {
                                    title: "正则匹配",
                                    path: "/Python/文本处理/字符串匹配/正则匹配"
                                }
                            ]
                        }
                    ]
                },
                {
                    title: "数学运算",
                    children: [
                        {
                            title: "♢ random",
                            path: "/Python/数学运算/random"
                        },
                        {
                            title: "♢ decimal",
                            path: "/Python/数学运算/decimal"
                        },
                        {
                            title: "♢ math",
                            path: "/Python/数学运算/math"
                        },
                        {
                            title: "♢ numpy",
                            path: "/Python/数学运算/numpy"
                        }
                    ]
                },
                {
                    title: "图像处理",
                    children: [
                        {
                            title: "电子图片",
                            path: "/Python/图像处理/电子图片"
                        },
                        {
                            title: "♢ Pillow",
                            path: "/Python/图像处理/Pillow"
                        },
                        {
                            title: "♢ Matplotlib",
                            path: "/Python/图像处理/Matplotlib"
                        },
                        {
                            title: "♢ NetworkX",
                            path: "/Python/图像处理/NetworkX"
                        },
                        {
                            title: "♢ pyecharts",
                            path: "/Python/图像处理/pyecharts"
                        }
                    ]
                },
                {
                    title: "网络通信",
                    children: [
                        {
                            title: "Email",
                            path: "/Python/网络通信/Email"
                        },
                        {
                            title: "♢ http",
                            path: "/Python/网络通信/http"
                        },
                        {
                            title: "♢ urllib",
                            path: "/Python/网络通信/urllib"
                        },
                        {
                            title: "♢ requests",
                            path: "/Python/网络通信/requests"
                        }
                    ]
                },
                {
                    title: "Django",
                    children: [
                        {
                            title: "Django",
                            path: "/Python/Django/Django"
                        },
                        {
                            title: "部署",
                            path: "/Python/Django/部署"
                        },
                        {
                            title: "静态文件",
                            path: "/Python/Django/静态文件"
                        },
                        {
                            title: "缓存",
                            path: "/Python/Django/缓存"
                        },
                        {
                            title: "插件",
                            path: "/Python/Django/插件"
                        }
                    ]
                },
                {
                    title: "混合开发",
                    children: [
                        {
                            title: "简介",
                            path: "/Python/混合开发/简介"
                        },
                        {
                            title: "♢ ctypes",
                            path: "/Python/混合开发/ctypes"
                        },
                        {
                            title: "♢ Cython",
                            path: "/Python/混合开发/Cython"
                        },
                        {
                            title: "♢ pybind11",
                            path: "/Python/混合开发/pybind11"
                        },
                        {
                            title: "SWIG",
                            path: "/Python/混合开发/SWIG"
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
                            title: "Linux",
                            path: "/Linux/简介/Linux"
                        },
                        {
                            title: "发行版",
                            path: "/Linux/简介/发行版"
                        },
                        {
                            title: "相关概念",
                            path: "/Linux/简介/相关概念"
                        }
                    ]
                },
                {
                    title: "终端",
                    children: [
                        {
                            title: "终端",
                            path: "/Linux/终端/终端"
                        },
                        {
                            title: "命令",
                            path: "/Linux/终端/命令"
                        },
                        {
                            title: "登录",
                            path: "/Linux/终端/登录"
                        },
                        {
                            title: "用户",
                            path: "/Linux/终端/用户"
                        }
                    ]
                },
                {
                    title: "进程",
                    children: [
                        {
                            title: "进程",
                            path: "/Linux/进程/进程"
                        },
                        {
                            title: "线程",
                            path: "/Linux/进程/线程"
                        },
                        {
                            title: "管理进程",
                            path: "/Linux/进程/管理进程"
                        }
                    ]
                },
                {
                    title: "文件",
                    children: [
                        {
                            title: "文件",
                            path: "/Linux/文件/文件"
                        },
                        {
                            title: "文件处理",
                            path: "/Linux/文件/文件处理/文件处理",
                            collapsable: false,
                            children: [
                                {
                                    title: "拷贝文件",
                                    path: "/Linux/文件/文件处理/拷贝文件"
                                },
                                {
                                    title: "压缩文件",
                                    path: "/Linux/文件/文件处理/压缩文件"
                                }
                            ]
                        },
                        {
                            title: "文本处理",
                            path: "/Linux/文件/文本处理/文本处理",
                            collapsable: false,
                            children: [
                                {
                                    title: "修改文本",
                                    path: "/Linux/文件/文本处理/修改文本"
                                }
                            ]
                        },
                        {
                            title: "文件属性",
                            path: "/Linux/文件/文件属性"
                        },
                        {
                            title: "文件权限",
                            path: "/Linux/文件/文件权限"
                        },
                        {
                            title: "目录",
                            path: "/Linux/文件/目录"
                        }
                    ]
                },
                {
                    title: "设备",
                    children: [
                        {
                            title: "设备",
                            path: "/Linux/设备/设备"
                        },
                        {
                            title: "CPU",
                            path: "/Linux/设备/CPU"
                        },
                        {
                            title: "GPU",
                            path: "/Linux/设备/GPU"
                        },
                        {
                            title: "内存",
                            path: "/Linux/设备/内存"
                        },
                        {
                            title: "外存",
                            path: "/Linux/设备/外存"
                        },
                        {
                            title: "磁盘管理",
                            path: "/Linux/设备/磁盘管理"
                        }
                    ]
                },
                {
                    title: "网络",
                    children: [
                        {
                            title: "IP",
                            path: "/Linux/网络/IP"
                        },
                        {
                            title: "DNS",
                            path: "/Linux/网络/DNS"
                        },
                        {
                            title: "Socket",
                            path: "/Linux/网络/Socket"
                        },
                        {
                            title: "防火墙",
                            path: "/Linux/网络/防火墙"
                        },
                        {
                            title: "SSH",
                            path: "/Linux/网络/SSH"
                        },
                        {
                            title: "FTP",
                            path: "/Linux/网络/FTP"
                        },
                        {
                            title: "HTTP",
                            path: "/Linux/网络/HTTP"
                        },
                        {
                            title: "网络代理",
                            path: "/Linux/网络/网络代理"
                        }
                    ]
                },
                {
                    title: "测试",
                    children: [
                        {
                            title: "简介",
                            path: "/Linux/测试/简介"
                        },
                        {
                            title: "进程测试",
                            path: "/Linux/测试/进程测试"
                        },
                        {
                            title: "网络测试",
                            path: "/Linux/测试/网络测试"
                        },
                        {
                            title: "综合测试",
                            path: "/Linux/测试/综合测试"
                        }
                    ]
                },
                {
                    title: "Shell",
                    children: [
                        {
                            title: "Shell",
                            path: "/Linux/Shell/Shell"
                        },
                        {
                            title: "变量",
                            path: "/Linux/Shell/变量"
                        },
                        {
                            title: "流程控制",
                            path: "/Linux/Shell/流程控制"
                        }
                    ]
                },
                {
                    title: "内核",
                    children: [
                        {
                            title: "开机",
                            path: "/Linux/内核/开机"
                        },
                        {
                            title: "架构",
                            path: "/Linux/内核/架构"
                        },
                        {
                            title: "配置",
                            path: "/Linux/内核/配置"
                        },
                        {
                            title: "CPU调度",
                            path: "/Linux/内核/CPU调度"
                        }
                    ]
                },
                {
                    title: "其它",
                    children: [
                        {
                            title: "系统信息",
                            path: "/Linux/其它/系统信息"
                        },
                        {
                            title: "安装软件",
                            path: "/Linux/其它/安装软件"
                        },
                        {
                            title: "日志",
                            path: "/Linux/其它/日志"
                        },
                        {
                            title: "时间",
                            path: "/Linux/其它/时间"
                        },
                        {
                            title: "定时任务",
                            path: "/Linux/其它/定时任务"
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
                            path: "/Network/计算机网络/简介"
                        },
                        {
                            title: "通信线路",
                            path: "/Network/计算机网络/通信线路"
                        },
                        {
                            title: "数据编码",
                            path: "/Network/计算机网络/数据编码"
                        },
                        {
                            title: "数据传输",
                            path: "/Network/计算机网络/数据传输"
                        },
                        {
                            title: "覆盖范围",
                            path: "/Network/计算机网络/覆盖范围"
                        }
                    ]
                },
                {
                    title: "网络设备",
                    children: [
                        {
                            title: "简介",
                            path: "/Network/网络设备/简介"
                        },
                        {
                            title: "交换机",
                            path: "/Network/网络设备/交换机"
                        },
                        {
                            title: "路由器",
                            path: "/Network/网络设备/路由器"
                        }
                    ]
                },
                {
                    title: "网络协议",
                    children: [
                        {
                            title: "简介",
                            path: "/Network/网络协议/简介"
                        },
                        {
                            title: "网络模型",
                            path: "/Network/网络协议/网络模型"
                        },
                        {
                            title: "IP",
                            path: "/Network/网络协议/IP"
                        },
                        {
                            title: "DNS",
                            path: "/Network/网络协议/DNS"
                        },
                        {
                            title: "TCP/UDP",
                            path: "/Network/网络协议/TCP-UDP"
                        }
                    ]
                },
                {
                    title: "计算机安全",
                    children: [
                        {
                            title: "恶意代码",
                            path: "/Network/计算机安全/恶意代码"
                        },
                        {
                            title: "网络安全",
                            path: "/Network/计算机安全/网络安全"
                        },
                        {
                            title: "Web安全",
                            path: "/Network/计算机安全/Web安全"
                        },
                        {
                            title: "密码安全",
                            path: "/Network/计算机安全/密码安全"
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
                            path: "/Web/简介/Web技术"
                        },
                        {
                            title: "Web爬虫",
                            path: "/Web/简介/Web爬虫"
                        }
                    ]
                },
                {
                    title: "通信协议",
                    children: [
                        {
                            title: "简介",
                            path: "/Web/通信协议/简介"
                        },
                        {
                            title: "HTTP",
                            path: "/Web/通信协议/HTTP"
                        },
                        {
                            title: "HTTPS",
                            path: "/Web/通信协议/HTTPS"
                        }
                    ]
                },
                {
                    title: "前端",
                    children: [
                        {
                            title: "简介",
                            path: "/Web/前端/简介"
                        },
                        {
                            title: "HTML",
                            path: "/Web/前端/HTML"
                        },
                        {
                            title: "CSS",
                            path: "/Web/前端/CSS"
                        },
                        {
                            title: "JavaScript",
                            path: "/Web/前端/JavaScript"
                        },
                        {
                            title: "TypeScript",
                            path: "/Web/前端/TypeScript"
                        },
                        {
                            title: "前端构建",
                            path: "/Web/前端/前端构建"
                        },
                        {
                            title: "Bootstrap",
                            path: "/Web/前端/Bootstrap"
                        },
                        {
                            title: "Vue.js",
                            path: "/Web/前端/Vue.js"
                        }
                    ]
                },
                {
                    title: "后端",
                    children: [
                        {
                            title: "后端框架",
                            path: "/Web/后端/后端框架"
                        },
                        {
                            title: "身份认证",
                            path: "/Web/后端/身份认证/身份认证",
                            collapsable: false,
                            children: [
                                {
                                    title: "OAuth",
                                    path: "/Web/后端/身份认证/OAuth"
                                },
                                {
                                    title: "LDAP",
                                    path: "/Web/后端/身份认证/LDAP/LDAP",
                                    collapsable: false,
                                    children: [
                                        {
                                            title: "OpenLDAP",
                                            path: "/Web/后端/身份认证/LDAP/OpenLDAP"
                                        },
                                        {
                                            title: "LdapAdmin",
                                            path: "/Web/后端/身份认证/LDAP/LdapAdmin"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    title: "Web服务器",
                    children: [
                        {
                            title: "简介",
                            path: "/Web/Web服务器/简介"
                        },
                        {
                            title: "Nginx",
                            path: "/Web/Web服务器/Nginx/Nginx",
                            collapsable: false,
                            children: [
                                {
                                    title: "配置",
                                    path: "/Web/Web服务器/Nginx/配置"
                                },
                                {
                                    title: "路由转发",
                                    path: "/Web/Web服务器/Nginx/路由转发"
                                },
                                {
                                    title: "访问控制",
                                    path: "/Web/Web服务器/Nginx/访问控制"
                                },
                                {
                                    title: "通信协议",
                                    path: "/Web/Web服务器/Nginx/通信协议"
                                }
                            ]
                        },
                        {
                            title: "Tomcat",
                            path: "/Web/Web服务器/Tomcat"
                        }
                    ]
                },
                {
                    title: "CMS",
                    children: [
                        {
                            title: "简介",
                            path: "/Web/CMS/简介"
                        },
                        {
                            title: "Jekyll",
                            path: "/Web/CMS/Jekyll"
                        },
                        {
                            title: "WordPress",
                            path: "/Web/CMS/WordPress"
                        },
                        {
                            title: "gitbook",
                            path: "/Web/CMS/gitbook"
                        },
                        {
                            title: "docsify",
                            path: "/Web/CMS/docsify"
                        },
                        {
                            title: "VuePress",
                            path: "/Web/CMS/VuePress"
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
                            path: "/Database/简介/数据库"
                        },
                        {
                            title: "数据表",
                            path: "/Database/简介/数据表"
                        },
                        {
                            title: "事务",
                            path: "/Database/简介/事务"
                        }
                    ]
                },
                {
                    title: "SQLite",
                    children: [
                        {
                            title: "SQLite",
                            path: "/Database/SQLite/SQLite"
                        },
                        {
                            title: "♢ sqlite3",
                            path: "/Database/SQLite/sqlite3"
                        }
                    ]
                },
                {
                    title: "MySQL",
                    children: [
                        {
                            title: "MySQL",
                            path: "/Database/MySQL/MySQL"
                        },
                        {
                            title: "部署",
                            path: "/Database/MySQL/部署"
                        },
                        {
                            title: "配置",
                            path: "/Database/MySQL/配置/配置",
                            collapsable: false,
                            children: [
                                {
                                    title: "日志",
                                    path: "/Database/MySQL/配置/日志"
                                },
                                {
                                    title: "存储引擎",
                                    path: "/Database/MySQL/配置/存储引擎"
                                }
                            ]
                        },
                        {
                            title: "管理单元",
                            path: "/Database/MySQL/管理单元"
                        },
                        {
                            title: "字段",
                            path: "/Database/MySQL/字段"
                        },
                        {
                            title: "查询",
                            path: "/Database/MySQL/查询/查询",
                            collapsable: false,
                            children: [
                                {
                                    title: "索引",
                                    path: "/Database/MySQL/查询/索引"
                                },
                                {
                                    title: "复合操作",
                                    path: "/Database/MySQL/查询/复合操作"
                                }
                            ]
                        },
                        {
                            title: "性能优化",
                            path: "/Database/MySQL/性能优化"
                        },
                        {
                            title: "♢ PyMySQL",
                            path: "/Database/MySQL/PyMySQL"
                        }
                    ]
                },
                {
                    title: "MongoDB",
                    children: [
                        {
                            title: "MongoDB",
                            path: "/Database/MongoDB/MongoDB"
                        },
                        {
                            title: "部署",
                            path: "/Database/MongoDB/部署"
                        },
                        {
                            title: "配置",
                            path: "/Database/MongoDB/配置"
                        },
                        {
                            title: "管理单元",
                            path: "/Database/MongoDB/管理单元"
                        },
                        {
                            title: "性能优化",
                            path: "/Database/MongoDB/性能优化"
                        },
                        {
                            title: "♢ pymongo",
                            path: "/Database/MongoDB/pymongo"
                        }
                    ]
                },
                {
                    title: "Redis",
                    children: [
                        {
                            title: "Redis",
                            path: "/Database/Redis/Redis"
                        },
                        {
                            title: "部署",
                            path: "/Database/Redis/部署"
                        },
                        {
                            title: "配置",
                            path: "/Database/Redis/配置"
                        },
                        {
                            title: "管理单元",
                            path: "/Database/Redis/管理单元"
                        },
                        {
                            title: "数据类型",
                            path: "/Database/Redis/数据类型"
                        },
                        {
                            title: "性能优化",
                            path: "/Database/Redis/性能优化"
                        },
                        {
                            title: "♢ redis",
                            path: "/Database/Redis/redis-py"
                        }
                    ]
                },
                {
                    title: "ES",
                    children: [
                        {
                            title: "ElasticSearch",
                            path: "/Database/ES/ElasticSearch"
                        },
                        {
                            title: "部署",
                            path: "/Database/ES/部署"
                        },
                        {
                            title: "管理单元",
                            path: "/Database/ES/管理单元"
                        },
                        {
                            title: "查询",
                            path: "/Database/ES/查询"
                        },
                        {
                            title: "配置",
                            path: "/Database/ES/配置"
                        },
                        {
                            title: "Kibana",
                            path: "/Database/ES/Kibana"
                        }
                    ]
                },
                {
                    title: "ClickHouse",
                    children: [
                        {
                            title: "ClickHouse",
                            path: "/Database/ClickHouse/ClickHouse"
                        },
                        {
                            title: "部署",
                            path: "/Database/ClickHouse/部署"
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
                    title: "CI/CD",
                    children: [
                        {
                            title: "Git",
                            path: "/DevOps/CI-CD/Git"
                        },
                        {
                            title: "GitLab",
                            path: "/DevOps/CI-CD/GitLab"
                        },
                        {
                            title: "GitHub",
                            path: "/DevOps/CI-CD/GitHub"
                        },
                        {
                            title: "Jenkins",
                            path: "/DevOps/CI-CD/Jenkins",
                            collapsable: false,
                            children: [
                                {
                                    title: "Jenkinsfile",
                                    path: "/DevOps/CI-CD/Jenkinsfile"
                                }
                            ]
                        }
                    ]
                },
                {
                    title: "容器",
                    path: "https://leohsiao.com/Container/"
                },
                {
                    title: "测试",
                    children: [
                        {
                            title: "Selenium",
                            path: "/DevOps/测试/Selenium"
                        },
                        {
                            title: "SonarQube",
                            path: "/DevOps/测试/SonarQube"
                        }
                    ]
                },
                {
                    title: "配置管理",
                    children: [
                        {
                            title: "简介",
                            path: "/DevOps/配置管理/简介"
                        },
                        {
                            title: "Ansible",
                            path: "/DevOps/配置管理/Ansible"
                        },
                        {
                            title: "Jumpserver",
                            path: "/DevOps/配置管理/Jumpserver"
                        },
                        {
                            title: "Supervisor",
                            path: "/DevOps/配置管理/Supervisor"
                        },
                        {
                            title: "Consul",
                            path: "/DevOps/配置管理/Consul"
                        },
                        {
                            title: "Nacos",
                            path: "/DevOps/配置管理/Nacos"
                        }
                    ]
                },
                {
                    title: "工件仓库",
                    children: [
                        {
                            title: "Artifactory",
                            path: "/DevOps/工件仓库/Artifactory"
                        },
                        {
                            title: "Nexus",
                            path: "/DevOps/工件仓库/Nexus"
                        },
                        {
                            title: "Harbor",
                            path: "/DevOps/工件仓库/Harbor"
                        }
                    ]
                },
                {
                    title: "监控告警",
                    children: [
                        {
                            title: "简介",
                            path: "/DevOps/监控告警/简介"
                        },
                        {
                            title: "Grafana",
                            path: "/DevOps/监控告警/Grafana"
                        },
                        {
                            title: "Zabbix",
                            path: "/DevOps/监控告警/Zabbix"
                        },
                        {
                            title: "Prometheus",
                            path: "/DevOps/监控告警/Prometheus/Prometheus",
                            collapsable: false,
                            children: [
                                {
                                    title: "原理",
                                    path: "/DevOps/监控告警/Prometheus/原理"
                                },
                                {
                                    title: "部署",
                                    path: "/DevOps/监控告警/Prometheus/部署"
                                },
                                {
                                    title: "exporter",
                                    path: "/DevOps/监控告警/Prometheus/exporter"
                                },
                                {
                                    title: "Pushgateway",
                                    path: "/DevOps/监控告警/Prometheus/Pushgateway"
                                },
                                {
                                    title: "Alertmanager",
                                    path: "/DevOps/监控告警/Prometheus/Alertmanager"
                                }
                            ]
                        },
                        {
                            title: "ELK",
                            path: "/DevOps/监控告警/ELK/ELK",
                            collapsable: false,
                            children: [
                                {
                                    title: "Filebeat",
                                    path: "/DevOps/监控告警/ELK/Filebeat"
                                },
                                {
                                    title: "Logstash",
                                    path: "/DevOps/监控告警/ELK/Logstash"
                                },
                                {
                                    title: "OpenSearch",
                                    path: "/DevOps/监控告警/ELK/OpenSearch"
                                }
                            ]
                        },
                        {
                            title: "Zipkin",
                            path: "/DevOps/监控告警/Zipkin"
                        },
                        {
                            title: "SkyWalking",
                            path: "/DevOps/监控告警/SkyWalking"
                        }
                    ]
                },
                {
                    title: "其它",
                    children: [
                        {
                            title: "VS Code",
                            path: "/DevOps/其它/VSCode"
                        },
                        {
                            title: "YApi",
                            path: "/DevOps/其它/YApi"
                        }
                    ]
                }
            ],
            "/Container/": [
                {
                    title: "《容器》",
                    path: "/Container/"
                },
                {
                    title: "简介",
                    children: [
                        {
                            title: "虚拟机与容器",
                            path: "/Container/introduction/虚拟机与容器"
                        }
                    ]
                },
                {
                    title: "Docker",
                    children: [
                        {
                            title: "Docker",
                            path: "/Container/Docker/Docker"
                        },
                        {
                            title: "原理",
                            path: "/Container/Docker/原理"
                        },
                        {
                            title: "容器",
                            path: "/Container/Docker/容器"
                        },
                        {
                            title: "镜像",
                            path: "/Container/Docker/镜像"
                        },
                        {
                            title: "Dockerfile",
                            path: "/Container/Docker/Dockerfile"
                        },
                        {
                            title: "Docker Compose",
                            path: "/Container/Docker/Docker-Compose"
                        }
                    ]
                },
                {
                    title: "Kubernetes",
                    children: [
                        {
                            title: "Kubernetes",
                            path: "/Container/k8s/Kubernetes"
                        },
                        {
                            title: "原理",
                            path: "/Container/k8s/principle/原理"
                        },
                        {
                            title: "部署",
                            path: "/Container/k8s/deploy/部署",
                            collapsable: false,
                            children: [
                                {
                                    title: "权限",
                                    path: "/Container/k8s/deploy/权限"
                                }
                            ]
                        },
                        {
                            title: "Pod",
                            path: "/Container/k8s/pod/Pod",
                            collapsable: false,
                            children: [
                                {
                                    title: "Workload",
                                    path: "/Container/k8s/pod/Workload"
                                },
                                {
                                    title: "自动伸缩",
                                    path: "/Container/k8s/pod/自动伸缩"
                                },
                                {
                                    title: "keda",
                                    path: "/Container/k8s/pod/keda"
                                }
                            ]
                        },
                        {
                            title: "Network",
                            path: "/Container/k8s/network/Network",
                            collapsable: false,
                            children: [
                                {
                                    title: "CNI",
                                    path: "/Container/k8s/network/CNI"
                                },
                                {
                                    title: "kube-vip",
                                    path: "/Container/k8s/network/kube-vip"
                                },
                                {
                                    title: "APISIX",
                                    path: "/Container/k8s/network/APISIX"
                                },
                                {
                                    title: "Istio",
                                    path: "/Container/k8s/network/Istio"
                                }
                            ]
                        },
                        {
                            title: "Volume",
                            path: "/Container/k8s/volume/Volume",
                            collapsable: false,
                            children: [
                                {
                                    title: "Longhorn",
                                    path: "/Container/k8s/volume/Longhorn"
                                }
                            ]
                        },
                        {
                            title: "扩展",
                            path: "/Container/k8s/extension/扩展",
                            collapsable: false,
                            children: [
                                {
                                    title: "Kustomize",
                                    path: "/Container/k8s/extension/Kustomize"
                                },
                                {
                                    title: "Helm",
                                    path: "/Container/k8s/extension/Helm"
                                }
                            ]
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
                            path: "/Distributed/简介/云计算"
                        },
                        {
                            title: "大数据",
                            path: "/Distributed/简介/大数据"
                        },
                        {
                            title: "微服务",
                            path: "/Distributed/简介/微服务"
                        }
                    ]
                },
                {
                    title: "分布式系统",
                    children: [
                        {
                            title: "简介",
                            path: "/Distributed/分布式系统/简介"
                        },
                        {
                            title: "ZooKeeper",
                            path: "/Distributed/分布式系统/ZooKeeper/ZooKeeper",
                            collapsable: false,
                            children: [
                                {
                                    title: "原理",
                                    path: "/Distributed/分布式系统/ZooKeeper/原理"
                                },
                                {
                                    title: "部署",
                                    path: "/Distributed/分布式系统/ZooKeeper/部署"
                                },
                                {
                                    title: "用法",
                                    path: "/Distributed/分布式系统/ZooKeeper/用法"
                                }
                            ]
                        },
                        {
                            title: "etcd",
                            path: "/Distributed/分布式系统/etcd"
                        }
                    ]
                },
                {
                    title: "消息队列",
                    children: [
                        {
                            title: "简介",
                            path: "/Distributed/消息队列/简介"
                        },
                        {
                            title: "ActiveMQ",
                            path: "/Distributed/消息队列/ActiveMQ"
                        },
                        {
                            title: "Kafka",
                            path: "/Distributed/消息队列/Kafka/Kafka",
                            collapsable: false,
                            children: [
                                {
                                    title: "原理",
                                    path: "/Distributed/消息队列/Kafka/原理"
                                },
                                {
                                    title: "部署",
                                    path: "/Distributed/消息队列/Kafka/部署"
                                },
                                {
                                    title: "工具",
                                    path: "/Distributed/消息队列/Kafka/工具"
                                }
                            ]
                        },
                        {
                            title: "Pulsar",
                            path: "/Distributed/消息队列/Pulsar"
                        },
                        {
                            title: "MQTT",
                            path: "/Distributed/消息队列/MQTT"
                        }
                    ]
                },
                {
                    title: "存储",
                    children: [
                        {
                            title: "简介",
                            path: "/Distributed/存储/简介"
                        },
                        {
                            title: "Ceph",
                            path: "/Distributed/存储/Ceph"
                        },
                        {
                            title: "FastDFS",
                            path: "/Distributed/存储/FastDFS"
                        },
                        {
                            title: "go-fastdfs",
                            path: "/Distributed/存储/go-fastdfs"
                        },
                        {
                            title: "h5ai",
                            path: "/Distributed/存储/h5ai"
                        },
                        {
                            title: "MinIO",
                            path: "/Distributed/存储/MinIO"
                        },
                        {
                            title: "Nextcloud",
                            path: "/Distributed/存储/Nextcloud"
                        }
                    ]
                },
                {
                    title: "区块链",
                    children: [
                        {
                            title: "简介",
                            path: "/Distributed/区块链/简介"
                        },
                        {
                            title: "BTC",
                            path: "/Distributed/区块链/BTC"
                        },
                        {
                            title: "ETH",
                            path: "/Distributed/区块链/ETH"
                        },
                        {
                            title: "DeFi",
                            path: "/Distributed/区块链/DeFi"
                        }
                    ]
                }
            ]
        }
    }
}
