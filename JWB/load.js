/** This script contains the code required for loading [[User:Joeytje50/AWB.js]].
 *  All other code is located at that page.
 */

//Idea by [[User:Epicgenius]]
$.when(mw.loader.using(['mediawiki.util'], $.ready)).done( function() {
	mw.util.addPortletLink("p-tb", mw.config.get('wgArticlePath').replace('$1', "Project:AutoWikiBrowser/Script"), "JS Wiki Browser", "tb-awbscript", "Run Javascript Wiki Browser");
});

if (mw.config.get('wgCanonicalNamespace')+':'+mw.config.get('wgTitle') === 'Project:AutoWikiBrowser/Script' && mw.config.get('wgAction') == 'view')
	mw.loader.load('https://cdn.jsdelivr.net/gh/dianliang233/dianliang-personal-js-css/master/JWB/JWB.js');