module.exports = {
    title: "LeoHsiao's Notes",
    description: ' ',
    host: '0.0.0.0',
    port: 80,
    base: '/',
    dest: 'docs/.vuepress/dist',
    lang: 'zh-CN',
	themeConfig: {
		sidebar: 'auto',
		nav: [
			{
				text: 'Notes',
				items: [
                    {
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
						text: '《Web》',
						link: '/Web/index'
					},
					{
						text: '《DevOps》',
						link: '/DevOps/index'
					}
				]
			}
		],
		repo: 'https://github.com/LeoHsiao1/Notes',
		repoLabel: 'GitHub',
		docsDir: 'docs',
		docsBranch: 'master',
		editLinks: true,
		editLinkText: 'Edit on GitHub',
		lastUpdated: 'Last Updated',
		smoothScroll: true,
	}
}