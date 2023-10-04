import { sidebar } from "vuepress-theme-hope";

export default sidebar(
// sidebar-start
{
    "/Programming/": [
        {
            text: "《编程》",
            link: "/Programming/"
        },
        {
            text: "编程语言",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Programming/编程语言/简介"
                },
                {
                    text: "C",
                    children: [
                        {
                            text: "编译",
                            link: "/Programming/编程语言/C/编译"
                        }
                    ]
                },
                {
                    text: "Java",
                    link: "/Programming/编程语言/Java/Java",
                    children: [
                        {
                            text: "构建",
                            link: "/Programming/编程语言/Java/构建"
                        },
                        {
                            text: "语法",
                            link: "/Programming/编程语言/Java/语法"
                        },
                        {
                            text: "GC",
                            link: "/Programming/编程语言/Java/GC"
                        }
                    ]
                },
                {
                    text: "Batch",
                    link: "/Programming/编程语言/Batch"
                },
                {
                    text: "Golang",
                    link: "/Programming/编程语言/Golang"
                },
                {
                    text: "Groovy",
                    link: "/Programming/编程语言/Groovy"
                },
                {
                    text: "Lisp",
                    link: "/Programming/编程语言/Lisp"
                },
                {
                    text: "Lua",
                    link: "/Programming/编程语言/Lua"
                },
                {
                    text: "Perl",
                    link: "/Programming/编程语言/Perl"
                },
                {
                    text: "PHP",
                    link: "/Programming/编程语言/PHP"
                },
                {
                    text: "Ruby",
                    link: "/Programming/编程语言/Ruby"
                }
            ]
        },
        {
            text: "算法",
            collapsible: true,
            children: [
                {
                    text: "哈希算法",
                    link: "/Programming/算法/哈希算法"
                },
                {
                    text: "加密算法",
                    link: "/Programming/算法/加密算法"
                },
                {
                    text: "图片相似算法",
                    link: "/Programming/算法/图片相似算法"
                }
            ]
        }
    ],
    "/Python/": [
        {
            text: "《Python》",
            link: "/Python/"
        },
        {
            text: "简介",
            collapsible: true,
            children: [
                {
                    text: "Python",
                    link: "/Python/简介/Python"
                },
                {
                    text: "解释器",
                    link: "/Python/简介/解释器"
                },
                {
                    text: "版本",
                    link: "/Python/简介/版本"
                }
            ]
        },
        {
            text: "模块与包",
            collapsible: true,
            children: [
                {
                    text: "模块与包",
                    link: "/Python/模块与包/模块与包"
                },
                {
                    text: "代码库",
                    link: "/Python/模块与包/代码库"
                }
            ]
        },
        {
            text: "文件处理",
            collapsible: true,
            children: [
                {
                    text: "文件对象",
                    link: "/Python/文件处理/文件对象"
                },
                {
                    text: "♢ io",
                    link: "/Python/文件处理/io"
                },
                {
                    text: "♢ logging",
                    link: "/Python/文件处理/logging"
                }
            ]
        },
        {
            text: "文本处理",
            collapsible: true,
            children: [
                {
                    text: "字节编码",
                    link: "/Python/文本处理/字节编码"
                },
                {
                    text: "字符编码",
                    link: "/Python/文本处理/字符编码"
                },
                {
                    text: "序列化",
                    link: "/Python/文本处理/序列化/序列化",
                    children: [
                        {
                            text: "INI",
                            link: "/Python/文本处理/序列化/INI"
                        },
                        {
                            text: "XML",
                            link: "/Python/文本处理/序列化/XML"
                        },
                        {
                            text: "JSON",
                            link: "/Python/文本处理/序列化/JSON"
                        },
                        {
                            text: "YAML",
                            link: "/Python/文本处理/序列化/YAML"
                        },
                        {
                            text: "pickle",
                            link: "/Python/文本处理/序列化/pickle"
                        },
                        {
                            text: "ProtoBuf",
                            link: "/Python/文本处理/序列化/ProtoBuf"
                        },
                        {
                            text: "Jinja",
                            link: "/Python/文本处理/序列化/Jinja"
                        },
                        {
                            text: "Markdown",
                            link: "/Python/文本处理/序列化/Markdown"
                        }
                    ]
                },
                {
                    text: "字符串匹配",
                    link: "/Python/文本处理/字符串匹配/字符串匹配",
                    children: [
                        {
                            text: "通配符",
                            link: "/Python/文本处理/字符串匹配/通配符"
                        },
                        {
                            text: "正则匹配",
                            link: "/Python/文本处理/字符串匹配/正则匹配"
                        }
                    ]
                }
            ]
        },
        {
            text: "数学运算",
            collapsible: true,
            children: [
                {
                    text: "♢ random",
                    link: "/Python/数学运算/random"
                },
                {
                    text: "♢ decimal",
                    link: "/Python/数学运算/decimal"
                },
                {
                    text: "♢ math",
                    link: "/Python/数学运算/math"
                },
                {
                    text: "♢ numpy",
                    link: "/Python/数学运算/numpy"
                }
            ]
        },
        {
            text: "图像处理",
            collapsible: true,
            children: [
                {
                    text: "电子图片",
                    link: "/Python/图像处理/电子图片"
                },
                {
                    text: "♢ Pillow",
                    link: "/Python/图像处理/Pillow"
                },
                {
                    text: "♢ Matplotlib",
                    link: "/Python/图像处理/Matplotlib"
                },
                {
                    text: "♢ NetworkX",
                    link: "/Python/图像处理/NetworkX"
                },
                {
                    text: "♢ pyecharts",
                    link: "/Python/图像处理/pyecharts"
                }
            ]
        },
        {
            text: "网络通信",
            collapsible: true,
            children: [
                {
                    text: "Email",
                    link: "/Python/网络通信/Email"
                },
                {
                    text: "♢ http",
                    link: "/Python/网络通信/http"
                },
                {
                    text: "♢ urllib",
                    link: "/Python/网络通信/urllib"
                },
                {
                    text: "♢ requests",
                    link: "/Python/网络通信/requests"
                }
            ]
        },
        {
            text: "Django",
            collapsible: true,
            children: [
                {
                    text: "Django",
                    link: "/Python/Django/Django"
                },
                {
                    text: "部署",
                    link: "/Python/Django/部署"
                },
                {
                    text: "静态文件",
                    link: "/Python/Django/静态文件"
                },
                {
                    text: "缓存",
                    link: "/Python/Django/缓存"
                },
                {
                    text: "插件",
                    link: "/Python/Django/插件"
                }
            ]
        },
        {
            text: "混合开发",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Python/混合开发/简介"
                },
                {
                    text: "♢ ctypes",
                    link: "/Python/混合开发/ctypes"
                },
                {
                    text: "♢ Cython",
                    link: "/Python/混合开发/Cython"
                },
                {
                    text: "♢ pybind11",
                    link: "/Python/混合开发/pybind11"
                },
                {
                    text: "SWIG",
                    link: "/Python/混合开发/SWIG"
                }
            ]
        }
    ],
    "/Linux/": [
        {
            text: "《Linux》",
            link: "/Linux/"
        },
        {
            text: "简介",
            collapsible: true,
            children: [
                {
                    text: "Linux",
                    link: "/Linux/简介/Linux"
                },
                {
                    text: "发行版",
                    link: "/Linux/简介/发行版"
                },
                {
                    text: "相关概念",
                    link: "/Linux/简介/相关概念"
                }
            ]
        },
        {
            text: "终端",
            collapsible: true,
            children: [
                {
                    text: "终端",
                    link: "/Linux/终端/终端"
                },
                {
                    text: "命令",
                    link: "/Linux/终端/命令"
                },
                {
                    text: "登录",
                    link: "/Linux/终端/登录"
                },
                {
                    text: "用户",
                    link: "/Linux/终端/用户"
                }
            ]
        },
        {
            text: "进程",
            collapsible: true,
            children: [
                {
                    text: "进程",
                    link: "/Linux/进程/进程"
                },
                {
                    text: "线程",
                    link: "/Linux/进程/线程"
                },
                {
                    text: "管理进程",
                    link: "/Linux/进程/管理进程"
                }
            ]
        },
        {
            text: "文件",
            collapsible: true,
            children: [
                {
                    text: "文件",
                    link: "/Linux/文件/文件"
                },
                {
                    text: "文件处理",
                    link: "/Linux/文件/文件处理/文件处理",
                    children: [
                        {
                            text: "拷贝文件",
                            link: "/Linux/文件/文件处理/拷贝文件"
                        },
                        {
                            text: "压缩文件",
                            link: "/Linux/文件/文件处理/压缩文件"
                        }
                    ]
                },
                {
                    text: "文本处理",
                    link: "/Linux/文件/文本处理/文本处理",
                    children: [
                        {
                            text: "修改文本",
                            link: "/Linux/文件/文本处理/修改文本"
                        }
                    ]
                },
                {
                    text: "文件属性",
                    link: "/Linux/文件/文件属性"
                },
                {
                    text: "文件权限",
                    link: "/Linux/文件/文件权限"
                },
                {
                    text: "目录",
                    link: "/Linux/文件/目录"
                }
            ]
        },
        {
            text: "设备",
            collapsible: true,
            children: [
                {
                    text: "设备",
                    link: "/Linux/设备/设备"
                },
                {
                    text: "CPU",
                    link: "/Linux/设备/CPU"
                },
                {
                    text: "内存",
                    link: "/Linux/设备/内存"
                },
                {
                    text: "外存",
                    link: "/Linux/设备/外存"
                },
                {
                    text: "磁盘管理",
                    link: "/Linux/设备/磁盘管理"
                }
            ]
        },
        {
            text: "网络",
            collapsible: true,
            children: [
                {
                    text: "IP",
                    link: "/Linux/网络/IP"
                },
                {
                    text: "DNS",
                    link: "/Linux/网络/DNS"
                },
                {
                    text: "Socket",
                    link: "/Linux/网络/Socket"
                },
                {
                    text: "防火墙",
                    link: "/Linux/网络/防火墙"
                },
                {
                    text: "SSH",
                    link: "/Linux/网络/SSH"
                },
                {
                    text: "FTP",
                    link: "/Linux/网络/FTP"
                },
                {
                    text: "HTTP",
                    link: "/Linux/网络/HTTP"
                },
                {
                    text: "网络代理",
                    link: "/Linux/网络/网络代理"
                }
            ]
        },
        {
            text: "测试",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Linux/测试/简介"
                },
                {
                    text: "进程测试",
                    link: "/Linux/测试/进程测试"
                },
                {
                    text: "网络测试",
                    link: "/Linux/测试/网络测试"
                },
                {
                    text: "综合测试",
                    link: "/Linux/测试/综合测试"
                }
            ]
        },
        {
            text: "Shell",
            collapsible: true,
            children: [
                {
                    text: "Shell",
                    link: "/Linux/Shell/Shell"
                },
                {
                    text: "变量",
                    link: "/Linux/Shell/变量"
                },
                {
                    text: "流程控制",
                    link: "/Linux/Shell/流程控制"
                }
            ]
        },
        {
            text: "系统内核",
            collapsible: true,
            children: [
                {
                    text: "系统信息",
                    link: "/Linux/系统内核/系统信息"
                },
                {
                    text: "开机",
                    link: "/Linux/系统内核/开机"
                },
                {
                    text: "内核",
                    link: "/Linux/系统内核/内核"
                }
            ]
        },
        {
            text: "其它",
            collapsible: true,
            children: [
                {
                    text: "安装软件",
                    link: "/Linux/其它/安装软件"
                },
                {
                    text: "日志",
                    link: "/Linux/其它/日志"
                },
                {
                    text: "时间",
                    link: "/Linux/其它/时间"
                },
                {
                    text: "定时任务",
                    link: "/Linux/其它/定时任务"
                }
            ]
        }
    ],
    "/Network/": [
        {
            text: "《计算机网络》",
            link: "/Network/"
        },
        {
            text: "计算机网络",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Network/计算机网络/简介"
                },
                {
                    text: "通信线路",
                    link: "/Network/计算机网络/通信线路"
                },
                {
                    text: "数据编码",
                    link: "/Network/计算机网络/数据编码"
                },
                {
                    text: "数据传输",
                    link: "/Network/计算机网络/数据传输"
                },
                {
                    text: "覆盖范围",
                    link: "/Network/计算机网络/覆盖范围"
                }
            ]
        },
        {
            text: "网络设备",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Network/网络设备/简介"
                },
                {
                    text: "交换机",
                    link: "/Network/网络设备/交换机"
                },
                {
                    text: "路由器",
                    link: "/Network/网络设备/路由器"
                }
            ]
        },
        {
            text: "网络协议",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Network/网络协议/简介"
                },
                {
                    text: "网络模型",
                    link: "/Network/网络协议/网络模型"
                },
                {
                    text: "IP",
                    link: "/Network/网络协议/IP"
                },
                {
                    text: "DNS",
                    link: "/Network/网络协议/DNS"
                },
                {
                    text: "TCP/UDP",
                    link: "/Network/网络协议/TCP-UDP"
                }
            ]
        },
        {
            text: "计算机安全",
            collapsible: true,
            children: [
                {
                    text: "恶意代码",
                    link: "/Network/计算机安全/恶意代码"
                },
                {
                    text: "网络安全",
                    link: "/Network/计算机安全/网络安全"
                },
                {
                    text: "Web安全",
                    link: "/Network/计算机安全/Web安全"
                },
                {
                    text: "密码安全",
                    link: "/Network/计算机安全/密码安全"
                }
            ]
        }
    ],
    "/Web/": [
        {
            text: "《Web》",
            link: "/Web/"
        },
        {
            text: "简介",
            collapsible: true,
            children: [
                {
                    text: "Web技术",
                    link: "/Web/简介/Web技术"
                },
                {
                    text: "Web爬虫",
                    link: "/Web/简介/Web爬虫"
                }
            ]
        },
        {
            text: "通信协议",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Web/通信协议/简介"
                },
                {
                    text: "HTTP",
                    link: "/Web/通信协议/HTTP"
                },
                {
                    text: "HTTPS",
                    link: "/Web/通信协议/HTTPS"
                }
            ]
        },
        {
            text: "前端",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Web/前端/简介"
                },
                {
                    text: "HTML",
                    link: "/Web/前端/HTML"
                },
                {
                    text: "CSS",
                    link: "/Web/前端/CSS"
                },
                {
                    text: "JavaScript",
                    link: "/Web/前端/JavaScript"
                },
                {
                    text: "TypeScript",
                    link: "/Web/前端/TypeScript"
                },
                {
                    text: "前端构建",
                    link: "/Web/前端/前端构建"
                },
                {
                    text: "Bootstrap",
                    link: "/Web/前端/Bootstrap"
                },
                {
                    text: "Vue.js",
                    link: "/Web/前端/Vue.js"
                }
            ]
        },
        {
            text: "后端",
            collapsible: true,
            children: [
                {
                    text: "后端框架",
                    link: "/Web/后端/后端框架"
                },
                {
                    text: "身份认证",
                    link: "/Web/后端/身份认证/身份认证",
                    children: [
                        {
                            text: "OAuth",
                            link: "/Web/后端/身份认证/OAuth"
                        },
                        {
                            text: "LDAP",
                            link: "/Web/后端/身份认证/LDAP/LDAP",
                            children: [
                                {
                                    text: "OpenLDAP",
                                    link: "/Web/后端/身份认证/LDAP/OpenLDAP"
                                },
                                {
                                    text: "LdapAdmin",
                                    link: "/Web/后端/身份认证/LDAP/LdapAdmin"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            text: "Web服务器",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Web/Web服务器/简介"
                },
                {
                    text: "Nginx",
                    link: "/Web/Web服务器/Nginx/Nginx",
                    children: [
                        {
                            text: "配置",
                            link: "/Web/Web服务器/Nginx/配置"
                        },
                        {
                            text: "路由转发",
                            link: "/Web/Web服务器/Nginx/路由转发"
                        },
                        {
                            text: "访问控制",
                            link: "/Web/Web服务器/Nginx/访问控制"
                        },
                        {
                            text: "通信协议",
                            link: "/Web/Web服务器/Nginx/通信协议"
                        },
                        {
                            text: "相关命令",
                            link: "/Web/Web服务器/Nginx/相关命令"
                        }
                    ]
                },
                {
                    text: "Tomcat",
                    link: "/Web/Web服务器/Tomcat"
                }
            ]
        },
        {
            text: "CMS",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Web/CMS/简介"
                },
                {
                    text: "Jekyll",
                    link: "/Web/CMS/Jekyll"
                },
                {
                    text: "WordPress",
                    link: "/Web/CMS/WordPress"
                },
                {
                    text: "gitbook",
                    link: "/Web/CMS/gitbook"
                },
                {
                    text: "docsify",
                    link: "/Web/CMS/docsify"
                },
                {
                    text: "VuePress",
                    link: "/Web/CMS/VuePress"
                }
            ]
        }
    ],
    "/Database/": [
        {
            text: "《Database》",
            link: "/Database/"
        },
        {
            text: "简介",
            collapsible: true,
            children: [
                {
                    text: "数据库",
                    link: "/Database/简介/数据库"
                },
                {
                    text: "数据表",
                    link: "/Database/简介/数据表"
                },
                {
                    text: "事务",
                    link: "/Database/简介/事务"
                }
            ]
        },
        {
            text: "SQLite",
            collapsible: true,
            children: [
                {
                    text: "SQLite",
                    link: "/Database/SQLite/SQLite"
                },
                {
                    text: "♢ sqlite3",
                    link: "/Database/SQLite/sqlite3"
                }
            ]
        },
        {
            text: "MySQL",
            collapsible: true,
            children: [
                {
                    text: "MySQL",
                    link: "/Database/MySQL/MySQL"
                },
                {
                    text: "部署",
                    link: "/Database/MySQL/部署"
                },
                {
                    text: "配置",
                    link: "/Database/MySQL/配置/配置",
                    children: [
                        {
                            text: "日志",
                            link: "/Database/MySQL/配置/日志"
                        },
                        {
                            text: "存储引擎",
                            link: "/Database/MySQL/配置/存储引擎"
                        }
                    ]
                },
                {
                    text: "管理单元",
                    link: "/Database/MySQL/管理单元"
                },
                {
                    text: "字段",
                    link: "/Database/MySQL/字段"
                },
                {
                    text: "查询",
                    link: "/Database/MySQL/查询/查询",
                    children: [
                        {
                            text: "索引",
                            link: "/Database/MySQL/查询/索引"
                        },
                        {
                            text: "复合操作",
                            link: "/Database/MySQL/查询/复合操作"
                        }
                    ]
                },
                {
                    text: "性能优化",
                    link: "/Database/MySQL/性能优化"
                },
                {
                    text: "♢ PyMySQL",
                    link: "/Database/MySQL/PyMySQL"
                }
            ]
        },
        {
            text: "MongoDB",
            collapsible: true,
            children: [
                {
                    text: "MongoDB",
                    link: "/Database/MongoDB/MongoDB"
                },
                {
                    text: "部署",
                    link: "/Database/MongoDB/部署"
                },
                {
                    text: "配置",
                    link: "/Database/MongoDB/配置"
                },
                {
                    text: "管理单元",
                    link: "/Database/MongoDB/管理单元"
                },
                {
                    text: "性能优化",
                    link: "/Database/MongoDB/性能优化"
                },
                {
                    text: "♢ pymongo",
                    link: "/Database/MongoDB/pymongo"
                }
            ]
        },
        {
            text: "Redis",
            collapsible: true,
            children: [
                {
                    text: "Redis",
                    link: "/Database/Redis/Redis"
                },
                {
                    text: "部署",
                    link: "/Database/Redis/部署"
                },
                {
                    text: "配置",
                    link: "/Database/Redis/配置"
                },
                {
                    text: "管理单元",
                    link: "/Database/Redis/管理单元"
                },
                {
                    text: "数据类型",
                    link: "/Database/Redis/数据类型"
                },
                {
                    text: "性能优化",
                    link: "/Database/Redis/性能优化"
                },
                {
                    text: "♢ redis",
                    link: "/Database/Redis/redis-py"
                }
            ]
        },
        {
            text: "ES",
            collapsible: true,
            children: [
                {
                    text: "ElasticSearch",
                    link: "/Database/ES/ElasticSearch"
                },
                {
                    text: "部署",
                    link: "/Database/ES/部署"
                },
                {
                    text: "管理单元",
                    link: "/Database/ES/管理单元"
                },
                {
                    text: "查询",
                    link: "/Database/ES/查询"
                },
                {
                    text: "配置",
                    link: "/Database/ES/配置"
                },
                {
                    text: "Kibana",
                    link: "/Database/ES/Kibana"
                }
            ]
        },
        {
            text: "ClickHouse",
            collapsible: true,
            children: [
                {
                    text: "ClickHouse",
                    link: "/Database/ClickHouse/ClickHouse"
                },
                {
                    text: "部署",
                    link: "/Database/ClickHouse/部署"
                }
            ]
        }
    ],
    "/DevOps/": [
        {
            text: "《DevOps》",
            link: "/DevOps/"
        },
        {
            text: "CI/CD",
            collapsible: true,
            children: [
                {
                    text: "Git",
                    link: "/DevOps/CI-CD/Git"
                },
                {
                    text: "GitLab",
                    link: "/DevOps/CI-CD/GitLab"
                },
                {
                    text: "GitHub",
                    link: "/DevOps/CI-CD/GitHub"
                },
                {
                    text: "Jenkins",
                    link: "/DevOps/CI-CD/Jenkins",
                    children: [
                        {
                            text: "Jenkinsfile",
                            link: "/DevOps/CI-CD/Jenkinsfile"
                        }
                    ]
                }
            ]
        },
        {
            text: "测试",
            collapsible: true,
            children: [
                {
                    text: "Selenium",
                    link: "/DevOps/测试/Selenium"
                },
                {
                    text: "SonarQube",
                    link: "/DevOps/测试/SonarQube"
                }
            ]
        },
        {
            text: "容器",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/DevOps/容器/简介"
                },
                {
                    text: "Docker",
                    link: "/DevOps/容器/Docker/Docker",
                    children: [
                        {
                            text: "原理",
                            link: "/DevOps/容器/Docker/原理"
                        },
                        {
                            text: "容器",
                            link: "/DevOps/容器/Docker/容器"
                        },
                        {
                            text: "镜像",
                            link: "/DevOps/容器/Docker/镜像"
                        },
                        {
                            text: "Dockerfile",
                            link: "/DevOps/容器/Docker/Dockerfile"
                        },
                        {
                            text: "Docker Compose",
                            link: "/DevOps/容器/Docker/Docker-Compose"
                        }
                    ]
                },
                {
                    text: "Kubernetes",
                    link: "/DevOps/容器/k8s/Kubernetes",
                    children: [
                        {
                            text: "原理",
                            link: "/DevOps/容器/k8s/原理"
                        },
                        {
                            text: "部署",
                            link: "/DevOps/容器/k8s/部署"
                        },
                        {
                            text: "Pod",
                            link: "/DevOps/容器/k8s/Pod"
                        },
                        {
                            text: "Workload",
                            link: "/DevOps/容器/k8s/Workload"
                        },
                        {
                            text: "Network",
                            link: "/DevOps/容器/k8s/Network"
                        },
                        {
                            text: "Volume",
                            link: "/DevOps/容器/k8s/Volume"
                        },
                        {
                            text: "权限",
                            link: "/DevOps/容器/k8s/权限"
                        },
                        {
                            text: "扩展",
                            link: "/DevOps/容器/k8s/扩展",
                            children: [
                                {
                                    text: "CNI",
                                    link: "/DevOps/容器/k8s/扩展/CNI"
                                },
                                {
                                    text: "kube-vip",
                                    link: "/DevOps/容器/k8s/扩展/kube-vip"
                                },
                                {
                                    text: "Kustomize",
                                    link: "/DevOps/容器/k8s/扩展/Kustomize"
                                },
                                {
                                    text: "Helm",
                                    link: "/DevOps/容器/k8s/扩展/Helm"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            text: "配置管理",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/DevOps/配置管理/简介"
                },
                {
                    text: "Ansible",
                    link: "/DevOps/配置管理/Ansible"
                },
                {
                    text: "Jumpserver",
                    link: "/DevOps/配置管理/Jumpserver"
                },
                {
                    text: "Supervisor",
                    link: "/DevOps/配置管理/Supervisor"
                },
                {
                    text: "Consul",
                    link: "/DevOps/配置管理/Consul"
                },
                {
                    text: "Nacos",
                    link: "/DevOps/配置管理/Nacos"
                }
            ]
        },
        {
            text: "工件仓库",
            collapsible: true,
            children: [
                {
                    text: "Artifactory",
                    link: "/DevOps/工件仓库/Artifactory"
                },
                {
                    text: "Nexus",
                    link: "/DevOps/工件仓库/Nexus"
                },
                {
                    text: "Harbor",
                    link: "/DevOps/工件仓库/Harbor"
                }
            ]
        },
        {
            text: "监控告警",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/DevOps/监控告警/简介"
                },
                {
                    text: "Grafana",
                    link: "/DevOps/监控告警/Grafana"
                },
                {
                    text: "Zabbix",
                    link: "/DevOps/监控告警/Zabbix"
                },
                {
                    text: "Prometheus",
                    link: "/DevOps/监控告警/Prometheus/Prometheus",
                    children: [
                        {
                            text: "原理",
                            link: "/DevOps/监控告警/Prometheus/原理"
                        },
                        {
                            text: "部署",
                            link: "/DevOps/监控告警/Prometheus/部署"
                        },
                        {
                            text: "exporter",
                            link: "/DevOps/监控告警/Prometheus/exporter"
                        },
                        {
                            text: "Pushgateway",
                            link: "/DevOps/监控告警/Prometheus/Pushgateway"
                        },
                        {
                            text: "Alertmanager",
                            link: "/DevOps/监控告警/Prometheus/Alertmanager"
                        }
                    ]
                },
                {
                    text: "ELK",
                    link: "/DevOps/监控告警/ELK/ELK",
                    children: [
                        {
                            text: "Filebeat",
                            link: "/DevOps/监控告警/ELK/Filebeat"
                        },
                        {
                            text: "Logstash",
                            link: "/DevOps/监控告警/ELK/Logstash"
                        },
                        {
                            text: "OpenSearch",
                            link: "/DevOps/监控告警/ELK/OpenSearch"
                        }
                    ]
                },
                {
                    text: "Zipkin",
                    link: "/DevOps/监控告警/Zipkin"
                },
                {
                    text: "SkyWalking",
                    link: "/DevOps/监控告警/SkyWalking"
                }
            ]
        },
        {
            text: "其它",
            collapsible: true,
            children: [
                {
                    text: "VS Code",
                    link: "/DevOps/其它/VSCode"
                },
                {
                    text: "YApi",
                    link: "/DevOps/其它/YApi"
                }
            ]
        }
    ],
    "/Distributed/": [
        {
            text: "《分布式》",
            link: "/Distributed/"
        },
        {
            text: "简介",
            collapsible: true,
            children: [
                {
                    text: "云计算",
                    link: "/Distributed/简介/云计算"
                },
                {
                    text: "大数据",
                    link: "/Distributed/简介/大数据"
                }
            ]
        },
        {
            text: "分布式系统",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Distributed/分布式系统/简介"
                },
                {
                    text: "ZooKeeper",
                    link: "/Distributed/分布式系统/ZooKeeper/ZooKeeper",
                    children: [
                        {
                            text: "原理",
                            link: "/Distributed/分布式系统/ZooKeeper/原理"
                        },
                        {
                            text: "部署",
                            link: "/Distributed/分布式系统/ZooKeeper/部署"
                        },
                        {
                            text: "用法",
                            link: "/Distributed/分布式系统/ZooKeeper/用法"
                        }
                    ]
                },
                {
                    text: "etcd",
                    link: "/Distributed/分布式系统/etcd"
                }
            ]
        },
        {
            text: "消息队列",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Distributed/消息队列/简介"
                },
                {
                    text: "ActiveMQ",
                    link: "/Distributed/消息队列/ActiveMQ"
                },
                {
                    text: "Kafka",
                    link: "/Distributed/消息队列/Kafka/Kafka",
                    children: [
                        {
                            text: "原理",
                            link: "/Distributed/消息队列/Kafka/原理"
                        },
                        {
                            text: "部署",
                            link: "/Distributed/消息队列/Kafka/部署"
                        },
                        {
                            text: "工具",
                            link: "/Distributed/消息队列/Kafka/工具"
                        }
                    ]
                },
                {
                    text: "Pulsar",
                    link: "/Distributed/消息队列/Pulsar"
                },
                {
                    text: "MQTT",
                    link: "/Distributed/消息队列/MQTT"
                }
            ]
        },
        {
            text: "存储",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Distributed/存储/简介"
                },
                {
                    text: "Ceph",
                    link: "/Distributed/存储/Ceph"
                },
                {
                    text: "FastDFS",
                    link: "/Distributed/存储/FastDFS"
                },
                {
                    text: "go-fastdfs",
                    link: "/Distributed/存储/go-fastdfs"
                },
                {
                    text: "h5ai",
                    link: "/Distributed/存储/h5ai"
                },
                {
                    text: "MinIO",
                    link: "/Distributed/存储/MinIO"
                },
                {
                    text: "Nextcloud",
                    link: "/Distributed/存储/Nextcloud"
                }
            ]
        },
        {
            text: "微服务",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Distributed/微服务/简介"
                },
                {
                    text: "APISIX",
                    link: "/Distributed/微服务/APISIX"
                },
                {
                    text: "Istio",
                    link: "/Distributed/微服务/Istio"
                }
            ]
        },
        {
            text: "区块链",
            collapsible: true,
            children: [
                {
                    text: "简介",
                    link: "/Distributed/区块链/简介"
                },
                {
                    text: "BTC",
                    link: "/Distributed/区块链/BTC"
                },
                {
                    text: "ETH",
                    link: "/Distributed/区块链/ETH"
                },
                {
                    text: "DeFi",
                    link: "/Distributed/区块链/DeFi"
                }
            ]
        }
    ]
},
// sidebar-end
);
