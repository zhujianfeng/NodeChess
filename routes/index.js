
/*
 * GET home page.
 */
var r=require('./test');
exports.test=r.test;
exports.index = function(req, res){
	var out=new Array();
	out["title"]="fuck";
	var temp= new Array();
	for(var i=0;i<1000;i++){
		temp[i]="fuck"+i;
	}
	out["arr"]=temp;
  res.render('index', out)
};
