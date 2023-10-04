import { navbar } from "vuepress-theme-hope";

// 导航栏位于网页顶部，显示以下链接
export default navbar([
    // navbar-start
    {
        text: "Notes",
        icon: "book",
        children: [
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
    },
    // navbar-end
]);
