parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"k8CM":[function(require,module,exports) {
    var t=function(){this.Diff_Timeout=1,this.Diff_EditCost=4,this.Match_Threshold=.5,this.Match_Distance=1e3,this.Patch_DeleteThreshold=.5,this.Patch_Margin=4,this.Match_MaxBits=32},e=-1,n=1,i=0;t.Diff=function(t,e){return[t,e]},t.prototype.diff_main=function(e,n,r,h){void 0===h&&(h=this.Diff_Timeout<=0?Number.MAX_VALUE:(new Date).getTime()+1e3*this.Diff_Timeout);var s=h;if(null==e||null==n)throw new Error("Null input. (diff_main)");if(e==n)return e?[new t.Diff(i,e)]:[];void 0===r&&(r=!0);var f=r,a=this.diff_commonPrefix(e,n),l=e.substring(0,a);e=e.substring(a),n=n.substring(a),a=this.diff_commonSuffix(e,n);var g=e.substring(e.length-a);e=e.substring(0,e.length-a),n=n.substring(0,n.length-a);var o=this.diff_compute_(e,n,f,s);return l&&o.unshift(new t.Diff(i,l)),g&&o.push(new t.Diff(i,g)),this.diff_cleanupMerge(o),o},t.prototype.diff_compute_=function(r,h,s,f){var a;if(!r)return[new t.Diff(n,h)];if(!h)return[new t.Diff(e,r)];var l=r.length>h.length?r:h,g=r.length>h.length?h:r,o=l.indexOf(g);if(-1!=o)return a=[new t.Diff(n,l.substring(0,o)),new t.Diff(i,g),new t.Diff(n,l.substring(o+g.length))],r.length>h.length&&(a[0][0]=a[2][0]=e),a;if(1==g.length)return[new t.Diff(e,r),new t.Diff(n,h)];var c=this.diff_halfMatch_(r,h);if(c){var u=c[0],p=c[1],d=c[2],_=c[3],b=c[4],v=this.diff_main(u,d,s,f),m=this.diff_main(p,_,s,f);return v.concat([new t.Diff(i,b)],m)}return s&&r.length>100&&h.length>100?this.diff_lineMode_(r,h,f):this.diff_bisect_(r,h,f)},t.prototype.diff_lineMode_=function(r,h,s){var f=this.diff_linesToChars_(r,h);r=f.chars1,h=f.chars2;var a=f.lineArray,l=this.diff_main(r,h,!1,s);this.diff_charsToLines_(l,a),this.diff_cleanupSemantic(l),l.push(new t.Diff(i,""));for(var g=0,o=0,c=0,u="",p="";g<l.length;){switch(l[g][0]){case n:c++,p+=l[g][1];break;case e:o++,u+=l[g][1];break;case i:if(o>=1&&c>=1){l.splice(g-o-c,o+c),g=g-o-c;for(var d=this.diff_main(u,p,!1,s),_=d.length-1;_>=0;_--)l.splice(g,0,d[_]);g+=d.length}c=0,o=0,u="",p=""}g++}return l.pop(),l},t.prototype.diff_bisect_=function(i,r,h){for(var s=i.length,f=r.length,a=Math.ceil((s+f)/2),l=a,g=2*a,o=new Array(g),c=new Array(g),u=0;u<g;u++)o[u]=-1,c[u]=-1;o[l+1]=0,c[l+1]=0;for(var p=s-f,d=p%2!=0,_=0,b=0,v=0,m=0,w=0;w<a&&!((new Date).getTime()>h);w++){for(var x=-w+_;x<=w-b;x+=2){for(var M=l+x,D=(I=x==-w||x!=w&&o[M-1]<o[M+1]?o[M+1]:o[M-1]+1)-x;I<s&&D<f&&i.charAt(I)==r.charAt(D);)I++,D++;if(o[M]=I,I>s)b+=2;else if(D>f)_+=2;else if(d){if((k=l+p-x)>=0&&k<g&&-1!=c[k])if(I>=(A=s-c[k]))return this.diff_bisectSplit_(i,r,I,D,h)}}for(var y=-w+v;y<=w-m;y+=2){for(var A,k=l+y,E=(A=y==-w||y!=w&&c[k-1]<c[k+1]?c[k+1]:c[k-1]+1)-y;A<s&&E<f&&i.charAt(s-A-1)==r.charAt(f-E-1);)A++,E++;if(c[k]=A,A>s)m+=2;else if(E>f)v+=2;else if(!d){if((M=l+p-y)>=0&&M<g&&-1!=o[M]){var I;D=l+(I=o[M])-M;if(I>=(A=s-A))return this.diff_bisectSplit_(i,r,I,D,h)}}}}return[new t.Diff(e,i),new t.Diff(n,r)]},t.prototype.diff_bisectSplit_=function(t,e,n,i,r){var h=t.substring(0,n),s=e.substring(0,i),f=t.substring(n),a=e.substring(i),l=this.diff_main(h,s,!1,r),g=this.diff_main(f,a,!1,r);return l.concat(g)},t.prototype.diff_linesToChars_=function(t,e){var n=[],i={};function r(t){for(var e="",r=0,s=-1,f=n.length;s<t.length-1;){-1==(s=t.indexOf("\n",r))&&(s=t.length-1);var a=t.substring(r,s+1);(i.hasOwnProperty?i.hasOwnProperty(a):void 0!==i[a])?e+=String.fromCharCode(i[a]):(f==h&&(a=t.substring(r),s=t.length),e+=String.fromCharCode(f),i[a]=f,n[f++]=a),r=s+1}return e}n[0]="";var h=4e4,s=r(t);return h=65535,{chars1:s,chars2:r(e),lineArray:n}},t.prototype.diff_charsToLines_=function(t,e){for(var n=0;n<t.length;n++){for(var i=t[n][1],r=[],h=0;h<i.length;h++)r[h]=e[i.charCodeAt(h)];t[n][1]=r.join("")}},t.prototype.diff_commonPrefix=function(t,e){if(!t||!e||t.charAt(0)!=e.charAt(0))return 0;for(var n=0,i=Math.min(t.length,e.length),r=i,h=0;n<r;)t.substring(h,r)==e.substring(h,r)?h=n=r:i=r,r=Math.floor((i-n)/2+n);return r},t.prototype.diff_commonSuffix=function(t,e){if(!t||!e||t.charAt(t.length-1)!=e.charAt(e.length-1))return 0;for(var n=0,i=Math.min(t.length,e.length),r=i,h=0;n<r;)t.substring(t.length-r,t.length-h)==e.substring(e.length-r,e.length-h)?h=n=r:i=r,r=Math.floor((i-n)/2+n);return r},t.prototype.diff_commonOverlap_=function(t,e){var n=t.length,i=e.length;if(0==n||0==i)return 0;n>i?t=t.substring(n-i):n<i&&(e=e.substring(0,n));var r=Math.min(n,i);if(t==e)return r;for(var h=0,s=1;;){var f=t.substring(r-s),a=e.indexOf(f);if(-1==a)return h;s+=a,0!=a&&t.substring(r-s)!=e.substring(0,s)||(h=s,s++)}},t.prototype.diff_halfMatch_=function(t,e){if(this.Diff_Timeout<=0)return null;var n=t.length>e.length?t:e,i=t.length>e.length?e:t;if(n.length<4||2*i.length<n.length)return null;var r=this;function h(t,e,n){for(var i,h,s,f,a=t.substring(n,n+Math.floor(t.length/4)),l=-1,g="";-1!=(l=e.indexOf(a,l+1));){var o=r.diff_commonPrefix(t.substring(n),e.substring(l)),c=r.diff_commonSuffix(t.substring(0,n),e.substring(0,l));g.length<c+o&&(g=e.substring(l-c,l)+e.substring(l,l+o),i=t.substring(0,n-c),h=t.substring(n+o),s=e.substring(0,l-c),f=e.substring(l+o))}return 2*g.length>=t.length?[i,h,s,f,g]:null}var s,f,a,l,g,o=h(n,i,Math.ceil(n.length/4)),c=h(n,i,Math.ceil(n.length/2));return o||c?(s=c?o&&o[4].length>c[4].length?o:c:o,t.length>e.length?(f=s[0],a=s[1],l=s[2],g=s[3]):(l=s[0],g=s[1],f=s[2],a=s[3]),[f,a,l,g,s[4]]):null},t.prototype.diff_cleanupSemantic=function(r){for(var h=!1,s=[],f=0,a=null,l=0,g=0,o=0,c=0,u=0;l<r.length;)r[l][0]==i?(s[f++]=l,g=c,o=u,c=0,u=0,a=r[l][1]):(r[l][0]==n?c+=r[l][1].length:u+=r[l][1].length,a&&a.length<=Math.max(g,o)&&a.length<=Math.max(c,u)&&(r.splice(s[f-1],0,new t.Diff(e,a)),r[s[f-1]+1][0]=n,f--,l=--f>0?s[f-1]:-1,g=0,o=0,c=0,u=0,a=null,h=!0)),l++;for(h&&this.diff_cleanupMerge(r),this.diff_cleanupSemanticLossless(r),l=1;l<r.length;){if(r[l-1][0]==e&&r[l][0]==n){var p=r[l-1][1],d=r[l][1],_=this.diff_commonOverlap_(p,d),b=this.diff_commonOverlap_(d,p);_>=b?(_>=p.length/2||_>=d.length/2)&&(r.splice(l,0,new t.Diff(i,d.substring(0,_))),r[l-1][1]=p.substring(0,p.length-_),r[l+1][1]=d.substring(_),l++):(b>=p.length/2||b>=d.length/2)&&(r.splice(l,0,new t.Diff(i,p.substring(0,b))),r[l-1][0]=n,r[l-1][1]=d.substring(0,d.length-b),r[l+1][0]=e,r[l+1][1]=p.substring(b),l++),l++}l++}},t.prototype.diff_cleanupSemanticLossless=function(e){function n(e,n){if(!e||!n)return 6;var i=e.charAt(e.length-1),r=n.charAt(0),h=i.match(t.nonAlphaNumericRegex_),s=r.match(t.nonAlphaNumericRegex_),f=h&&i.match(t.whitespaceRegex_),a=s&&r.match(t.whitespaceRegex_),l=f&&i.match(t.linebreakRegex_),g=a&&r.match(t.linebreakRegex_),o=l&&e.match(t.blanklineEndRegex_),c=g&&n.match(t.blanklineStartRegex_);return o||c?5:l||g?4:h&&!f&&a?3:f||a?2:h||s?1:0}for(var r=1;r<e.length-1;){if(e[r-1][0]==i&&e[r+1][0]==i){var h=e[r-1][1],s=e[r][1],f=e[r+1][1],a=this.diff_commonSuffix(h,s);if(a){var l=s.substring(s.length-a);h=h.substring(0,h.length-a),s=l+s.substring(0,s.length-a),f=l+f}for(var g=h,o=s,c=f,u=n(h,s)+n(s,f);s.charAt(0)===f.charAt(0);){h+=s.charAt(0),s=s.substring(1)+f.charAt(0),f=f.substring(1);var p=n(h,s)+n(s,f);p>=u&&(u=p,g=h,o=s,c=f)}e[r-1][1]!=g&&(g?e[r-1][1]=g:(e.splice(r-1,1),r--),e[r][1]=o,c?e[r+1][1]=c:(e.splice(r+1,1),r--))}r++}},t.nonAlphaNumericRegex_=/[^a-zA-Z0-9]/,t.whitespaceRegex_=/\s/,t.linebreakRegex_=/[\r\n]/,t.blanklineEndRegex_=/\n\r?\n$/,t.blanklineStartRegex_=/^\r?\n\r?\n/,t.prototype.diff_cleanupEfficiency=function(r){for(var h=!1,s=[],f=0,a=null,l=0,g=!1,o=!1,c=!1,u=!1;l<r.length;)r[l][0]==i?(r[l][1].length<this.Diff_EditCost&&(c||u)?(s[f++]=l,g=c,o=u,a=r[l][1]):(f=0,a=null),c=u=!1):(r[l][0]==e?u=!0:c=!0,a&&(g&&o&&c&&u||a.length<this.Diff_EditCost/2&&g+o+c+u==3)&&(r.splice(s[f-1],0,new t.Diff(e,a)),r[s[f-1]+1][0]=n,f--,a=null,g&&o?(c=u=!0,f=0):(l=--f>0?s[f-1]:-1,c=u=!1),h=!0)),l++;h&&this.diff_cleanupMerge(r)},t.prototype.diff_cleanupMerge=function(r){r.push(new t.Diff(i,""));for(var h,s=0,f=0,a=0,l="",g="";s<r.length;)switch(r[s][0]){case n:a++,g+=r[s][1],s++;break;case e:f++,l+=r[s][1],s++;break;case i:f+a>1?(0!==f&&0!==a&&(0!==(h=this.diff_commonPrefix(g,l))&&(s-f-a>0&&r[s-f-a-1][0]==i?r[s-f-a-1][1]+=g.substring(0,h):(r.splice(0,0,new t.Diff(i,g.substring(0,h))),s++),g=g.substring(h),l=l.substring(h)),0!==(h=this.diff_commonSuffix(g,l))&&(r[s][1]=g.substring(g.length-h)+r[s][1],g=g.substring(0,g.length-h),l=l.substring(0,l.length-h))),s-=f+a,r.splice(s,f+a),l.length&&(r.splice(s,0,new t.Diff(e,l)),s++),g.length&&(r.splice(s,0,new t.Diff(n,g)),s++),s++):0!==s&&r[s-1][0]==i?(r[s-1][1]+=r[s][1],r.splice(s,1)):s++,a=0,f=0,l="",g=""}""===r[r.length-1][1]&&r.pop();var o=!1;for(s=1;s<r.length-1;)r[s-1][0]==i&&r[s+1][0]==i&&(r[s][1].substring(r[s][1].length-r[s-1][1].length)==r[s-1][1]?(r[s][1]=r[s-1][1]+r[s][1].substring(0,r[s][1].length-r[s-1][1].length),r[s+1][1]=r[s-1][1]+r[s+1][1],r.splice(s-1,1),o=!0):r[s][1].substring(0,r[s+1][1].length)==r[s+1][1]&&(r[s-1][1]+=r[s+1][1],r[s][1]=r[s][1].substring(r[s+1][1].length)+r[s+1][1],r.splice(s+1,1),o=!0)),s++;o&&this.diff_cleanupMerge(r)},t.prototype.diff_xIndex=function(t,i){var r,h=0,s=0,f=0,a=0;for(r=0;r<t.length&&(t[r][0]!==n&&(h+=t[r][1].length),t[r][0]!==e&&(s+=t[r][1].length),!(h>i));r++)f=h,a=s;return t.length!=r&&t[r][0]===e?a:a+(i-f)},t.prototype.diff_prettyHtml=function(t){for(var r=[],h=/&/g,s=/</g,f=/>/g,a=/\n/g,l=0;l<t.length;l++){var g=t[l][0],o=t[l][1].replace(h,"&amp;").replace(s,"&lt;").replace(f,"&gt;").replace(a,"&para;<br>");switch(g){case n:r[l]='<ins style="background:#e6ffe6;">'+o+"</ins>";break;case e:r[l]='<del style="background:#ffe6e6;">'+o+"</del>";break;case i:r[l]="<span>"+o+"</span>"}}return r.join("")},t.prototype.diff_text1=function(t){for(var e=[],i=0;i<t.length;i++)t[i][0]!==n&&(e[i]=t[i][1]);return e.join("")},t.prototype.diff_text2=function(t){for(var n=[],i=0;i<t.length;i++)t[i][0]!==e&&(n[i]=t[i][1]);return n.join("")},t.prototype.diff_levenshtein=function(t){for(var r=0,h=0,s=0,f=0;f<t.length;f++){var a=t[f][0],l=t[f][1];switch(a){case n:h+=l.length;break;case e:s+=l.length;break;case i:r+=Math.max(h,s),h=0,s=0}}return r+=Math.max(h,s)},t.prototype.diff_toDelta=function(t){for(var r=[],h=0;h<t.length;h++)switch(t[h][0]){case n:r[h]="+"+encodeURI(t[h][1]);break;case e:r[h]="-"+t[h][1].length;break;case i:r[h]="="+t[h][1].length}return r.join("\t").replace(/%20/g," ")},t.prototype.diff_fromDelta=function(r,h){for(var s=[],f=0,a=0,l=h.split(/\t/g),g=0;g<l.length;g++){var o=l[g].substring(1);switch(l[g].charAt(0)){case"+":try{s[f++]=new t.Diff(n,decodeURI(o))}catch(p){throw new Error("Illegal escape in diff_fromDelta: "+o)}break;case"-":case"=":var c=parseInt(o,10);if(isNaN(c)||c<0)throw new Error("Invalid number in diff_fromDelta: "+o);var u=r.substring(a,a+=c);"="==l[g].charAt(0)?s[f++]=new t.Diff(i,u):s[f++]=new t.Diff(e,u);break;default:if(l[g])throw new Error("Invalid diff operation in diff_fromDelta: "+l[g])}}if(a!=r.length)throw new Error("Delta length ("+a+") does not equal source text length ("+r.length+").");return s},t.prototype.match_main=function(t,e,n){if(null==t||null==e||null==n)throw new Error("Null input. (match_main)");return n=Math.max(0,Math.min(n,t.length)),t==e?0:t.length?t.substring(n,n+e.length)==e?n:this.match_bitap_(t,e,n):-1},t.prototype.match_bitap_=function(t,e,n){if(e.length>this.Match_MaxBits)throw new Error("Pattern too long for this browser.");var i=this.match_alphabet_(e),r=this;function h(t,i){var h=t/e.length,s=Math.abs(n-i);return r.Match_Distance?h+s/r.Match_Distance:s?1:h}var s=this.Match_Threshold,f=t.indexOf(e,n);-1!=f&&(s=Math.min(h(0,f),s),-1!=(f=t.lastIndexOf(e,n+e.length))&&(s=Math.min(h(0,f),s)));var a,l,g=1<<e.length-1;f=-1;for(var o,c=e.length+t.length,u=0;u<e.length;u++){for(a=0,l=c;a<l;)h(u,n+l)<=s?a=l:c=l,l=Math.floor((c-a)/2+a);c=l;var p=Math.max(1,n-l+1),d=Math.min(n+l,t.length)+e.length,_=Array(d+2);_[d+1]=(1<<u)-1;for(var b=d;b>=p;b--){var v=i[t.charAt(b-1)];if(_[b]=0===u?(_[b+1]<<1|1)&v:(_[b+1]<<1|1)&v|(o[b+1]|o[b])<<1|1|o[b+1],_[b]&g){var m=h(u,b-1);if(m<=s){if(s=m,!((f=b-1)>n))break;p=Math.max(1,2*n-f)}}}if(h(u+1,n)>s)break;o=_}return f},t.prototype.match_alphabet_=function(t){for(var e={},n=0;n<t.length;n++)e[t.charAt(n)]=0;for(n=0;n<t.length;n++)e[t.charAt(n)]|=1<<t.length-n-1;return e},t.prototype.patch_addContext_=function(e,n){if(0!=n.length){if(null===e.start2)throw Error("patch not initialized");for(var r=n.substring(e.start2,e.start2+e.length1),h=0;n.indexOf(r)!=n.lastIndexOf(r)&&r.length<this.Match_MaxBits-this.Patch_Margin-this.Patch_Margin;)h+=this.Patch_Margin,r=n.substring(e.start2-h,e.start2+e.length1+h);h+=this.Patch_Margin;var s=n.substring(e.start2-h,e.start2);s&&e.diffs.unshift(new t.Diff(i,s));var f=n.substring(e.start2+e.length1,e.start2+e.length1+h);f&&e.diffs.push(new t.Diff(i,f)),e.start1-=s.length,e.start2-=s.length,e.length1+=s.length+f.length,e.length2+=s.length+f.length}},t.prototype.patch_make=function(r,h,s){var f,a;if("string"==typeof r&&"string"==typeof h&&void 0===s)f=r,(a=this.diff_main(f,h,!0)).length>2&&(this.diff_cleanupSemantic(a),this.diff_cleanupEfficiency(a));else if(r&&"object"==typeof r&&void 0===h&&void 0===s)a=r,f=this.diff_text1(a);else if("string"==typeof r&&h&&"object"==typeof h&&void 0===s)f=r,a=h;else{if("string"!=typeof r||"string"!=typeof h||!s||"object"!=typeof s)throw new Error("Unknown call format to patch_make.");f=r,a=s}if(0===a.length)return[];for(var l=[],g=new t.patch_obj,o=0,c=0,u=0,p=f,d=f,_=0;_<a.length;_++){var b=a[_][0],v=a[_][1];switch(o||b===i||(g.start1=c,g.start2=u),b){case n:g.diffs[o++]=a[_],g.length2+=v.length,d=d.substring(0,u)+v+d.substring(u);break;case e:g.length1+=v.length,g.diffs[o++]=a[_],d=d.substring(0,u)+d.substring(u+v.length);break;case i:v.length<=2*this.Patch_Margin&&o&&a.length!=_+1?(g.diffs[o++]=a[_],g.length1+=v.length,g.length2+=v.length):v.length>=2*this.Patch_Margin&&o&&(this.patch_addContext_(g,p),l.push(g),g=new t.patch_obj,o=0,p=d,c=u)}b!==n&&(c+=v.length),b!==e&&(u+=v.length)}return o&&(this.patch_addContext_(g,p),l.push(g)),l},t.prototype.patch_deepCopy=function(e){for(var n=[],i=0;i<e.length;i++){var r=e[i],h=new t.patch_obj;h.diffs=[];for(var s=0;s<r.diffs.length;s++)h.diffs[s]=new t.Diff(r.diffs[s][0],r.diffs[s][1]);h.start1=r.start1,h.start2=r.start2,h.length1=r.length1,h.length2=r.length2,n[i]=h}return n},t.prototype.patch_apply=function(t,r){if(0==t.length)return[r,[]];t=this.patch_deepCopy(t);var h=this.patch_addPadding(t);r=h+r+h,this.patch_splitMax(t);for(var s=0,f=[],a=0;a<t.length;a++){var l,g,o=t[a].start2+s,c=this.diff_text1(t[a].diffs),u=-1;if(c.length>this.Match_MaxBits?-1!=(l=this.match_main(r,c.substring(0,this.Match_MaxBits),o))&&(-1==(u=this.match_main(r,c.substring(c.length-this.Match_MaxBits),o+c.length-this.Match_MaxBits))||l>=u)&&(l=-1):l=this.match_main(r,c,o),-1==l)f[a]=!1,s-=t[a].length2-t[a].length1;else if(f[a]=!0,s=l-o,c==(g=-1==u?r.substring(l,l+c.length):r.substring(l,u+this.Match_MaxBits)))r=r.substring(0,l)+this.diff_text2(t[a].diffs)+r.substring(l+c.length);else{var p=this.diff_main(c,g,!1);if(c.length>this.Match_MaxBits&&this.diff_levenshtein(p)/c.length>this.Patch_DeleteThreshold)f[a]=!1;else{this.diff_cleanupSemanticLossless(p);for(var d,_=0,b=0;b<t[a].diffs.length;b++){var v=t[a].diffs[b];v[0]!==i&&(d=this.diff_xIndex(p,_)),v[0]===n?r=r.substring(0,l+d)+v[1]+r.substring(l+d):v[0]===e&&(r=r.substring(0,l+d)+r.substring(l+this.diff_xIndex(p,_+v[1].length))),v[0]!==e&&(_+=v[1].length)}}}}return[r=r.substring(h.length,r.length-h.length),f]},t.prototype.patch_addPadding=function(e){for(var n=this.Patch_Margin,r="",h=1;h<=n;h++)r+=String.fromCharCode(h);for(h=0;h<e.length;h++)e[h].start1+=n,e[h].start2+=n;var s=e[0],f=s.diffs;if(0==f.length||f[0][0]!=i)f.unshift(new t.Diff(i,r)),s.start1-=n,s.start2-=n,s.length1+=n,s.length2+=n;else if(n>f[0][1].length){var a=n-f[0][1].length;f[0][1]=r.substring(f[0][1].length)+f[0][1],s.start1-=a,s.start2-=a,s.length1+=a,s.length2+=a}if(0==(f=(s=e[e.length-1]).diffs).length||f[f.length-1][0]!=i)f.push(new t.Diff(i,r)),s.length1+=n,s.length2+=n;else if(n>f[f.length-1][1].length){a=n-f[f.length-1][1].length;f[f.length-1][1]+=r.substring(0,a),s.length1+=a,s.length2+=a}return r},t.prototype.patch_splitMax=function(r){for(var h=this.Match_MaxBits,s=0;s<r.length;s++)if(!(r[s].length1<=h)){var f=r[s];r.splice(s--,1);for(var a=f.start1,l=f.start2,g="";0!==f.diffs.length;){var o=new t.patch_obj,c=!0;for(o.start1=a-g.length,o.start2=l-g.length,""!==g&&(o.length1=o.length2=g.length,o.diffs.push(new t.Diff(i,g)));0!==f.diffs.length&&o.length1<h-this.Patch_Margin;){var u=f.diffs[0][0],p=f.diffs[0][1];u===n?(o.length2+=p.length,l+=p.length,o.diffs.push(f.diffs.shift()),c=!1):u===e&&1==o.diffs.length&&o.diffs[0][0]==i&&p.length>2*h?(o.length1+=p.length,a+=p.length,c=!1,o.diffs.push(new t.Diff(u,p)),f.diffs.shift()):(p=p.substring(0,h-o.length1-this.Patch_Margin),o.length1+=p.length,a+=p.length,u===i?(o.length2+=p.length,l+=p.length):c=!1,o.diffs.push(new t.Diff(u,p)),p==f.diffs[0][1]?f.diffs.shift():f.diffs[0][1]=f.diffs[0][1].substring(p.length))}g=(g=this.diff_text2(o.diffs)).substring(g.length-this.Patch_Margin);var d=this.diff_text1(f.diffs).substring(0,this.Patch_Margin);""!==d&&(o.length1+=d.length,o.length2+=d.length,0!==o.diffs.length&&o.diffs[o.diffs.length-1][0]===i?o.diffs[o.diffs.length-1][1]+=d:o.diffs.push(new t.Diff(i,d))),c||r.splice(++s,0,o)}}},t.prototype.patch_toText=function(t){for(var e=[],n=0;n<t.length;n++)e[n]=t[n];return e.join("")},t.prototype.patch_fromText=function(r){var h=[];if(!r)return h;for(var s=r.split("\n"),f=0,a=/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;f<s.length;){var l=s[f].match(a);if(!l)throw new Error("Invalid patch string: "+s[f]);var g=new t.patch_obj;for(h.push(g),g.start1=parseInt(l[1],10),""===l[2]?(g.start1--,g.length1=1):"0"==l[2]?g.length1=0:(g.start1--,g.length1=parseInt(l[2],10)),g.start2=parseInt(l[3],10),""===l[4]?(g.start2--,g.length2=1):"0"==l[4]?g.length2=0:(g.start2--,g.length2=parseInt(l[4],10)),f++;f<s.length;){var o=s[f].charAt(0);try{var c=decodeURI(s[f].substring(1))}catch(u){throw new Error("Illegal escape in patch_fromText: "+c)}if("-"==o)g.diffs.push(new t.Diff(e,c));else if("+"==o)g.diffs.push(new t.Diff(n,c));else if(" "==o)g.diffs.push(new t.Diff(i,c));else{if("@"==o)break;if(""!==o)throw new Error('Invalid patch mode "'+o+'" in: '+c)}f++}}return h},t.patch_obj=function(){this.diffs=[],this.start1=null,this.start2=null,this.length1=0,this.length2=0},t.patch_obj.prototype.toString=function(){for(var t,r=["@@ -"+(0===this.length1?this.start1+",0":1==this.length1?this.start1+1:this.start1+1+","+this.length1)+" +"+(0===this.length2?this.start2+",0":1==this.length2?this.start2+1:this.start2+1+","+this.length2)+" @@\n"],h=0;h<this.diffs.length;h++){switch(this.diffs[h][0]){case n:t="+";break;case e:t="-";break;case i:t=" "}r[h+1]=t+encodeURI(this.diffs[h][1])+"\n"}return r.join("").replace(/%20/g," ")},module.exports=t,module.exports.diff_match_patch=t,module.exports.DIFF_DELETE=e,module.exports.DIFF_INSERT=n,module.exports.DIFF_EQUAL=i;
    },{}],"iSlp":[function(require,module,exports) {
    function t(t,o,n){return o in t?Object.defineProperty(t,o,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[o]=n,t}function o(t){return(o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function n(t){return t&&"object"===o(t)&&!Array.isArray(t)&&null!==t}module.exports=function o(e,r){return n(e)&&n(r)&&Object.keys(r).forEach(function(u){n(r[u])?(e[u]&&n(e[u])||(e[u]=r[u]),o(e[u],r[u])):Object.assign(e,t({},u,r[u]))}),e};
    },{}],"Os6R":[function(require,module,exports) {
    module.exports=function(n,t){var r=this,e=arguments.length>2&&void 0!==arguments[2]&&arguments[2],l=null,o=!0;return function(){for(var u=arguments.length,i=new Array(u),a=0;a<u;a++)i[a]=arguments[a];var f=function(){n.apply(r,i),l=null};e&&o&&(o=!1,f()),l||(l=setTimeout(f,t))}};
    },{}],"gTec":[function(require,module,exports) {
    module.exports=function(r,t){var e,n=this;return function(){for(var o=arguments.length,u=new Array(o),a=0;a<o;a++)u[a]=arguments[a];var i=n;clearTimeout(e),e=setTimeout(function(){return r.apply(i,u)},t)}};
    },{}],"xRfK":[function(require,module,exports) {
    module.exports=function(){return(arguments.length>0&&void 0!==arguments[0]?arguments[0]:"").replace(/\r\n/g,"\n")};
    },{}],"j8WE":[function(require,module,exports) {
    module.exports=function(c,n,o,t){var a=c+(o-c)/2;return"M ".concat(c," ").concat(n," C ").concat(a,",").concat(n," ").concat(a,",").concat(t," ").concat(o,",").concat(t)};
    },{}],"iJA9":[function(require,module,exports) {
    module.exports={DIFF_EQUAL:0,DIFF_DELETE:-1,DIFF_INSERT:1,EDITOR_RIGHT:"right",EDITOR_LEFT:"left",RTL:"rtl",LTR:"ltr",SVG_NS:"http://www.w3.org/2000/svg",DIFF_GRANULARITY_SPECIFIC:"specific",DIFF_GRANULARITY_BROAD:"broad"};
    },{}],"gWhB":[function(require,module,exports) {
    var o=require("../constants");module.exports=function(t,e){var n=t.options.mode;return e===o.EDITOR_LEFT&&null!==t.options.left.mode&&(n=t.options.left.mode),e===o.EDITOR_RIGHT&&null!==t.options.right.mode&&(n=t.options.right.mode),n};
    },{"../constants":"iJA9"}],"IRlp":[function(require,module,exports) {
    var t=require("../constants");module.exports=function(e,o){var n=e.options.theme;return o===t.EDITOR_LEFT&&null!==e.options.left.theme&&(n=e.options.left.theme),o===t.EDITOR_RIGHT&&null!==e.options.right.theme&&(n=e.options.right.theme),n};
    },{"../constants":"iJA9"}],"L8P8":[function(require,module,exports) {
    module.exports=function(e,n){return e.ace.getSession().doc.getLine(n)};
    },{}],"gpkQ":[function(require,module,exports) {
    module.exports=function(e){return document.getElementById(e.options.left.id).offsetHeight};
    },{}],"QEUm":[function(require,module,exports) {
    module.exports=function(t){var e=document.createElement("div"),n={class:t.className,style:"top:".concat(t.topOffset,"px"),title:t.tooltip,"data-diff-index":t.diffIndex};for(var o in n)e.setAttribute(o,n[o]);return e.innerHTML=t.arrowContent,e};
    },{}],"f1Db":[function(require,module,exports) {
    module.exports=function(t,e){var r=Math.random().toString(36).substr(2,5),n="js-".concat(e,"-").concat(r),a=t.querySelector(".".concat(e));if(a)return a.id=a.id||n,a.id;var c=document.createElement("div");return t.appendChild(c),c.className=e,c.id=n,c.id};
    },{}],"FPMV":[function(require,module,exports) {
    function e(e,t,o,r){var n="document"===e?document:document.querySelector(e);n.addEventListener(t,function(e){for(var t=n.querySelectorAll(o),c=e.target,l=0,u=t.length;l<u;l+=1)for(var a=c,d=t[l];a&&a!==n;)a===d&&r.call(d,e),a=a.parentNode})}module.exports={on:e};
    },{}],"Focm":[function(require,module,exports) {
    var e,t=require("diff-match-patch"),n=require("./helpers/merge"),i=require("./helpers/throttle"),r=require("./helpers/debounce"),o=require("./helpers/normalizeContent"),s=require("./visuals/getCurve"),a=require("./visuals/getMode"),c=require("./visuals/getTheme"),l=require("./visuals/getLine"),d=require("./visuals/getEditorHeight"),f=require("./visuals/createArrow"),h=require("./dom/ensureElement"),g=require("./dom/query"),u=require("./constants");function p(e){if(e.Range)return e.Range;var t=e.acequire||e.require;return!!t&&t("ace/range")}function L(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};if(!(this instanceof L))return new L(t);var i=this;i.options=n({ace:window?window.ace:void 0,mode:null,theme:null,element:null,diffGranularity:u.DIFF_GRANULARITY_BROAD,lockScrolling:!1,showDiffs:!0,showConnectors:!0,maxDiffs:5e3,left:{id:null,content:null,mode:null,theme:null,editable:!0,copyLinkEnabled:!0},right:{id:null,content:null,mode:null,theme:null,editable:!0,copyLinkEnabled:!0},classes:{gutterID:"acediff__gutter",diff:"acediff__diffLine",connector:"acediff__connector",newCodeConnectorLink:"acediff__newCodeConnector",newCodeConnectorLinkContent:"&#8594;",deletedCodeConnectorLink:"acediff__deletedCodeConnector",deletedCodeConnectorLinkContent:"&#8592;",copyRightContainer:"acediff__copy--right",copyLeftContainer:"acediff__copy--left"},connectorYOffset:0},t);var r=i.options.ace;if(!r){var s="No ace editor found nor supplied - `options.ace` or `window.ace` is missing";return console.error(s),new Error(s)}if(!(e=p(r))){var l="Could not require Range module for Ace. Depends on your bundling strategy, but it usually comes with Ace itself. See https://ace.c9.io/api/range.html, open an issue on GitHub ace-diff/ace-diff";return console.error(l),new Error(l)}if(null===i.options.element){var f="You need to specify an element for Ace-diff - `options.element` is missing";return console.error(f),new Error(f)}if(i.options.element instanceof HTMLElement?i.el=i.options.element:i.el=document.body.querySelector(i.options.element),!i.el){var g="Can't find the specified element ".concat(i.options.element);return console.error(g),new Error(g)}i.options.left.id=h(i.el,"acediff__left"),i.options.classes.gutterID=h(i.el,"acediff__gutter"),i.options.right.id=h(i.el,"acediff__right"),i.el.innerHTML='<div class="acediff__wrap">'.concat(i.el.innerHTML,"</div>"),i.editors={left:{ace:r.edit(i.options.left.id),markers:[],lineLengths:[]},right:{ace:r.edit(i.options.right.id),markers:[],lineLengths:[]},editorHeight:null},i.editors.left.ace.getSession().setMode(a(i,u.EDITOR_LEFT)),i.editors.right.ace.getSession().setMode(a(i,u.EDITOR_RIGHT)),i.editors.left.ace.setReadOnly(!i.options.left.editable),i.editors.right.ace.setReadOnly(!i.options.right.editable),i.editors.left.ace.setTheme(c(i,u.EDITOR_LEFT)),i.editors.right.ace.setTheme(c(i,u.EDITOR_RIGHT)),i.editors.left.ace.setValue(o(i.options.left.content),-1),i.editors.right.ace.setValue(o(i.options.right.content),-1),i.editors.editorHeight=d(i),setTimeout(function(){i.lineHeight=i.editors.left.ace.renderer.lineHeight,C(i),O(i),F(i),i.diff()},1)}L.prototype={setOptions:function(e){n(this.options,e),this.diff()},getNumDiffs:function(){return this.diffs.length},getEditors:function(){return{left:this.editors.left.ace,right:this.editors.right.ace}},diff:function(){var e=this,n=new t,i=this.editors.left.ace.getSession().getValue(),r=this.editors.right.ace.getSession().getValue(),o=n.diff_main(r,i);n.diff_cleanupSemantic(o),this.editors.left.lineLengths=S(this.editors.left),this.editors.right.lineLengths=S(this.editors.right);var s=[],a={left:0,right:0};o.forEach(function(t,n,i){var r=t[0],c=t[1];i[n+1]&&c.endsWith("\n")&&i[n+1][1].startsWith("\n")&&(c+="\n",o[n][1]=c,o[n+1][1]=o[n+1][1].replace(/^\n/,"")),0!==c.length&&(r===u.DIFF_EQUAL?(a.left+=c.length,a.right+=c.length):r===u.DIFF_DELETE?(s.push(R(e,u.DIFF_DELETE,a.left,a.right,c)),a.right+=c.length):r===u.DIFF_INSERT&&(s.push(R(e,u.DIFF_INSERT,a.left,a.right,c)),a.left+=c.length))},this),this.diffs=G(this,s),this.diffs.length>this.options.maxDiffs||(I(this),N(this))},destroy:function(){var e=this.editors.left.ace.getValue();this.editors.left.ace.destroy();var t=this.editors.left.ace.container,n=t.cloneNode(!1);n.textContent=e,t.parentNode.replaceChild(n,t);var i=this.editors.right.ace.getValue();this.editors.right.ace.destroy(),(n=(t=this.editors.right.ace.container).cloneNode(!1)).textContent=i,t.parentNode.replaceChild(n,t),document.getElementById(this.options.classes.gutterID).innerHTML="",E()}};var E=function(){};function C(e){e.editors.left.ace.getSession().on("changeScrollTop",i(function(){y(e)},16)),e.editors.right.ace.getSession().on("changeScrollTop",i(function(){y(e)},16));var t=e.diff.bind(e);e.editors.left.ace.on("change",t),e.editors.right.ace.on("change",t),e.options.left.copyLinkEnabled&&g.on("#".concat(e.options.classes.gutterID),"click",".".concat(e.options.classes.newCodeConnectorLink),function(t){m(e,t,u.LTR)}),e.options.right.copyLinkEnabled&&g.on("#".concat(e.options.classes.gutterID),"click",".".concat(e.options.classes.deletedCodeConnectorLink),function(t){m(e,t,u.RTL)});var n=r(function(){e.editors.availableHeight=document.getElementById(e.options.left.id).offsetHeight,e.diff()},250);window.addEventListener("resize",n),E=function(){window.removeEventListener("resize",n)}}function m(t,n,i){var r,o,s,a,c,d,f=parseInt(n.target.getAttribute("data-diff-index"),10),h=t.diffs[f];i===u.LTR?(r=t.editors.left,o=t.editors.right,s=h.leftStartLine,a=h.leftEndLine,c=h.rightStartLine,d=h.rightEndLine):(r=t.editors.right,o=t.editors.left,s=h.rightStartLine,a=h.rightEndLine,c=h.leftStartLine,d=h.leftEndLine);for(var g="",p=s;p<a;p+=1)g+="".concat(l(r,p),"\n");var L=o.ace.getSession().getScrollTop();o.ace.getSession().replace(new e(c,0,d,0),g),o.ace.getSession().setScrollTop(parseInt(L,10)),t.diff()}function S(e){var t=e.ace.getSession().doc.getAllLines(),n=[];return t.forEach(function(e){n.push(e.length+1)}),n}function v(t,n,i,r,o){var s=t.editors[n];r<i&&(r=i);var a="".concat(o," ").concat(r>i?"lines":"targetOnly");s.markers.push(s.ace.session.addMarker(new e(i,0,r-1,1),a,"fullLine"))}function y(e){I(e),N(e),D(e)}function I(e){e.editors.left.markers.forEach(function(t){e.editors.left.ace.getSession().removeMarker(t)},e),e.editors.right.markers.forEach(function(t){e.editors.right.ace.getSession().removeMarker(t)},e)}function T(e,t,n,i,r){var o=e.editors.left.ace.getSession().getScrollTop(),a=e.editors.right.ace.getSession().getScrollTop();e.connectorYOffset=1;var c=t*e.lineHeight-o+.5,l=e.gutterWidth+1,d=i*e.lineHeight-a+.5,f=n*e.lineHeight-o+e.connectorYOffset+.5,h=e.gutterWidth+1,g=r*e.lineHeight-a+e.connectorYOffset+.5,p=s(-1,c,l,d),L=s(h,g,-1,f),E="L".concat(l,",").concat(d," ").concat(h,",").concat(g),C="L".concat(-1,",").concat(f," ").concat(-1,",").concat(c),m="".concat(p," ").concat(E," ").concat(L," ").concat(C),S=document.createElementNS(u.SVG_NS,"path");S.setAttribute("d",m),S.setAttribute("class",e.options.classes.connector),e.gutterSVG.appendChild(S)}function _(e,t,n){if(t.leftEndLine>t.leftStartLine&&e.options.left.copyLinkEnabled){var i=f({className:e.options.classes.newCodeConnectorLink,topOffset:t.leftStartLine*e.lineHeight,tooltip:"Copy to right",diffIndex:n,arrowContent:e.options.classes.newCodeConnectorLinkContent});e.copyRightContainer.appendChild(i)}if(t.rightEndLine>t.rightStartLine&&e.options.right.copyLinkEnabled){var r=f({className:e.options.classes.deletedCodeConnectorLink,topOffset:t.rightStartLine*e.lineHeight,tooltip:"Copy to left",diffIndex:n,arrowContent:e.options.classes.deletedCodeConnectorLinkContent});e.copyLeftContainer.appendChild(r)}}function D(e){var t=e.editors.left.ace.getSession().getScrollTop(),n=e.editors.right.ace.getSession().getScrollTop();e.copyRightContainer.style.cssText="top: ".concat(-t,"px"),e.copyLeftContainer.style.cssText="top: ".concat(-n,"px")}function R(e,t,n,i,r){var o={},s=/^\n/.test(r);if(t===u.DIFF_INSERT){var a=w(e.editors.left,n,r),c=b(e.editors.right,i),l=k(e.editors.right,c),d=k(e.editors.left,a.startLine),f=c;0===k(e.editors.left,a.startLine)&&s&&(s=!1),0===a.startChar&&H(e.editors.right,i,s)&&(f=c+1);var h=a.startLine===a.endLine,g=0;(a.startChar>0||h&&r.length<d)&&l>0&&a.startChar<d&&g++,o={leftStartLine:a.startLine,leftEndLine:a.endLine+1,rightStartLine:f,rightEndLine:f+g}}else{a=w(e.editors.right,i,r),c=b(e.editors.left,n),l=k(e.editors.left,c);var p=k(e.editors.right,a.startLine),L=c;0===k(e.editors.right,a.startLine)&&s&&(s=!1),0===a.startChar&&H(e.editors.left,n,s)&&(L=c+1);h=a.startLine===a.endLine,g=0;(a.startChar>0||h&&r.length<p)&&l>0&&a.startChar<p&&g++,o={leftStartLine:L,leftEndLine:L+g,rightStartLine:a.startLine,rightEndLine:a.endLine+1}}return o}function w(e,t,n){var i={startLine:0,startChar:0,endLine:0,endChar:0},r=t+n.length,o=0,s=!1,a=!1;e.lineLengths.forEach(function(e,n){o+=e,!s&&t<o&&(i.startLine=n,i.startChar=t-o+e,s=!0),!a&&r<=o&&(i.endLine=n,i.endChar=r-o+e,a=!0)}),i.startChar>0&&k(e,i.startLine)===i.startChar&&(i.startLine++,i.startChar=0),0===i.endChar&&i.endLine--;var c=/\n$/.test(n);return i.startChar>0&&c&&i.endLine++,i}function k(e,t){return l(e,t).length}function b(e,t){for(var n=e.ace.getSession().doc.getAllLines(),i=0,r=0,o=0;o<n.length;o+=1)if(t<=(r+=n[o].length+1)){i=o;break}return i}function H(e,t,n){for(var i=e.ace.getSession().doc.getAllLines(),r=0,o=0;o<i.length;o+=1){var s=r+=i[o].length+1;if(n&&(s-=1),t===s)break}return H}function F(e){e.gutterHeight=document.getElementById(e.options.classes.gutterID).clientHeight,e.gutterWidth=document.getElementById(e.options.classes.gutterID).clientWidth;var t=A(e,u.EDITOR_LEFT),n=A(e,u.EDITOR_RIGHT),i=Math.max(t,n,e.gutterHeight);e.gutterSVG=document.createElementNS(u.SVG_NS,"svg"),e.gutterSVG.setAttribute("width",e.gutterWidth),e.gutterSVG.setAttribute("height",i),document.getElementById(e.options.classes.gutterID).appendChild(e.gutterSVG)}function A(e,t){return(t===u.EDITOR_LEFT?e.editors.left:e.editors.right).ace.getSession().getLength()*e.lineHeight}function O(e){e.copyRightContainer=document.createElement("div"),e.copyRightContainer.setAttribute("class",e.options.classes.copyRightContainer),e.copyLeftContainer=document.createElement("div"),e.copyLeftContainer.setAttribute("class",e.options.classes.copyLeftContainer),document.getElementById(e.options.classes.gutterID).appendChild(e.copyRightContainer),document.getElementById(e.options.classes.gutterID).appendChild(e.copyLeftContainer)}function q(e){document.getElementById(e.options.classes.gutterID).removeChild(e.gutterSVG),F(e)}function M(e){e.copyLeftContainer.innerHTML="",e.copyRightContainer.innerHTML=""}function G(e,t){var n=[];function i(t){return e.options.diffGranularity===u.DIFF_GRANULARITY_SPECIFIC?t<1:t<=1}t.forEach(function(e,t){if(0!==t){for(var r=!1,o=0;o<n.length;o+=1)if(i(Math.abs(e.leftStartLine-n[o].leftEndLine))&&i(Math.abs(e.rightStartLine-n[o].rightEndLine))){n[o].leftStartLine=Math.min(e.leftStartLine,n[o].leftStartLine),n[o].rightStartLine=Math.min(e.rightStartLine,n[o].rightStartLine),n[o].leftEndLine=Math.max(e.leftEndLine,n[o].leftEndLine),n[o].rightEndLine=Math.max(e.rightEndLine,n[o].rightEndLine),r=!0;break}r||n.push(e)}else n.push(e)});var r=[];return n.forEach(function(e){e.leftStartLine===e.leftEndLine&&e.rightStartLine===e.rightEndLine||r.push(e)}),r}function N(e){q(e),M(e),e.diffs.forEach(function(t,n){e.options.showDiffs&&(v(e,u.EDITOR_LEFT,t.leftStartLine,t.leftEndLine,e.options.classes.diff),v(e,u.EDITOR_RIGHT,t.rightStartLine,t.rightEndLine,e.options.classes.diff),e.options.showConnectors&&T(e,t.leftStartLine,t.leftEndLine,t.rightStartLine,t.rightEndLine),_(e,t,n))},e)}module.exports=L;
    },{"diff-match-patch":"k8CM","./helpers/merge":"iSlp","./helpers/throttle":"Os6R","./helpers/debounce":"gTec","./helpers/normalizeContent":"xRfK","./visuals/getCurve":"j8WE","./visuals/getMode":"gWhB","./visuals/getTheme":"IRlp","./visuals/getLine":"L8P8","./visuals/getEditorHeight":"gpkQ","./visuals/createArrow":"QEUm","./dom/ensureElement":"f1Db","./dom/query":"FPMV","./constants":"iJA9"}]},{},["Focm"], "AceDiff")
    //# sourceMappingURL=ace-diff.js.map