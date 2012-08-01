/**
 * Created with JetBrains WebStorm.
 * User: zhujianfeng
 * Date: 12-6-16
 * Time: 下午4:48
 * To change this template use File | Settings | File Templates.
 */

(function(window) {
    var chess = function(chessId, piecesId, webSocket) {
            var me                   = {};
            me.socket                = webSocket;
            me.chessCanvas           = document.getElementById(chessId); //棋盘Canvas
            me.cxt                   = me.chessCanvas.getContext("2d");
            me.boardHight            = me.chessCanvas.height; //棋盘高度
            me.boardWidth            = me.chessCanvas.width; //棋盘宽度
            me.piecesCanvas          = document.getElementById(piecesId); //棋子Canvas
            me.piecesCanvas.height   = me.boardHight; //保证棋子Canvas的高度宽度与棋盘相同
            me.piecesCanvas.width    = me.boardWidth;
            me.piececxt              = me.piecesCanvas.getContext("2d");
            me.piececxt.font         = 'bold 30px 宋体'; //设置棋子中字体
            me.piececxt.textBaseline = 'middle'; //棋子文字中线垂直对齐
            me.piececxt.textAlign    = "center"; //棋子文字水平居中对齐
            me.startX                = 0; //棋盘从Canvas的左起始点
            me.startY                = 0; //棋盘从Canvas的上起始点
            me.xStep                 = 0; //棋盘格子横向间距
            me.yStep                 = 0; //棋盘格子垂直间距
            me.piecesList            = {
                "opposite": {},
                "our": {}
            }; //棋子列表
            me.board       = [];
            me.ourColor    = "black";
            me.status      = "idle"; //idle,active,wait
            me.activePiece = "";

            /*
             *  根据传入的阵营获取颜色
             */
            me.getColor = function(position) {
                if (position == "opposite") {
                    return me.getOppositeColor();
                } else {
                    return me.getOurColor();
                }
            };
            /*
             * 取得对方颜色
             */
            me.getOppositeColor = function() {
                if (me.ourColor == "red") {
                    return "black";
                } else {
                    return "red";
                }
            };

            /*
             * 取得本方颜色
             */
            me.getOurColor = function() {
                return me.ourColor;
            };
            /*
             * 棋子对象
             */
            me.Piece = function(role, lineX, lineY, color) {
                var piece = {};
                piece.getPos = function() {
                    return {
                        x: me.startX + (piece.lineX - 1) * me.xStep,
                        y: me.startY + (piece.lineY - 1) * me.yStep
                    };
                };
                piece.moveToNew = function(newX, newY) {
                    if (newX < 1 || newX > 9) {
                        return false;
                    }
                    if (newY < 1 || newY > 10) {
                        return false;
                    }
                    piece.lineX = newX;
                    piece.lineY = newY;
                    return true;
                };
                piece.color = color;
                piece.alive = true;
                piece.active = false;
                piece.role = role;
                piece.lineX = lineX;
                piece.lineY = lineY;
                return piece;
            };
            /*
             * 取得棋子的半径
             */
            me.getPiecesR = function() {
                var r = me.xStep > me.yStep ? me.xStep : me.yStep;
                r = 0.4 * r;
                return r;
            };
            /*
             *绘制棋盘，确定棋盘左上角起点位置以及横向纵向间距
             */
            me.drawChessBoard = function() {
                var drawLine = function(x1, y1, x2, y2) {
                        me.cxt.moveTo(x1, y1);
                        me.cxt.lineTo(x2, y2);
                        me.cxt.stroke();
                    };
                var drawWordInRiver = function() {
                        me.cxt.font = 'bold 30px 宋体';
                        me.cxt.textBaseline = 'middle';
                        me.cxt.textAlign = "center";
                        me.cxt.fillText('楚河', lrS1 + 2 * lrStep, tbS1 + 4.5 * tbStep);
                        me.cxt.fillText('汉界', lrS1 + 6 * lrStep, tbS1 + 4.5 * tbStep);
                    };
                var drawStar = function(x, y, xStep, yStep, half) {
                        var drawLeftHalf = function() {
                                drawLine(x1, y1, x1, y1 - lyStep);
                                drawLine(x1, y1, x1 - lxStep, y1);
                                drawLine(x1, y2, x1, y2 + lyStep);
                                drawLine(x1, y2, x1 - lxStep, y2);
                            };
                        var drawRightHalf = function() {
                                drawLine(x2, y1, x2, y1 - lyStep);
                                drawLine(x2, y1, x2 + lxStep, y1);
                                drawLine(x2, y2, x2, y2 + lyStep);
                                drawLine(x2, y2, x2 + lxStep, y2);
                            };
                        var pRatio = 0.08,
                            lRatio = 0.15,
                            lxStep = lRatio * xStep,
                            lyStep = lRatio * yStep;
                        var x1 = x - xStep * pRatio;
                        var x2 = x + xStep * pRatio;
                        var y1 = y - yStep * pRatio;
                        var y2 = y + yStep * pRatio;
                        if (half == "left") {
                            drawLeftHalf();
                        } else if (half == "right") {
                            drawRightHalf();
                        } else {
                            drawLeftHalf();
                            drawRightHalf();
                        }
                    };
                var lrMargin = 0.1;
                var tbMargin = 0.05;
                var lrStep = me.boardWidth * 0.1;
                var tbStep = me.boardHight * 0.1;
                var tbS1 = tbMargin * me.boardHight;
                var tbS2 = tbS1 + 4 * tbStep;
                var tbS3 = tbS2 + tbStep;
                var tbS4 = tbS3 + 4 * tbStep;
                for (var i = 0; i < 9; i++) {
                    var tmpS = lrMargin * me.boardWidth + i * lrStep;
                    if (i == 0 || i == 8) {
                        drawLine(tmpS, tbS1, tmpS, tbS4);
                    } else {
                        drawLine(tmpS, tbS1, tmpS, tbS2);
                        drawLine(tmpS, tbS3, tmpS, tbS4);
                    }
                }
                var lrS1 = lrMargin * me.boardWidth;
                var lrS2 = lrS1 + 8 * lrStep;
                for (var i = 0; i < 10; i++) {
                    var tmpP = tbMargin * me.boardHight + i * tbStep;
                    drawLine(lrS1, tmpP, lrS2, tmpP);
                }
                var starPoint = [{
                    x: lrS1 + lrStep,
                    y: tbS1 + 2 * tbStep
                }, {
                    x: lrS1 + 7 * lrStep,
                    y: tbS1 + 2 * tbStep
                }, {
                    x: lrS1 + lrStep,
                    y: tbS1 + 7 * tbStep
                }, {
                    x: lrS1 + 7 * lrStep,
                    y: tbS1 + 7 * tbStep
                }, {
                    x: lrS1 + 2 * lrStep,
                    y: tbS1 + 3 * tbStep
                }, {
                    x: lrS1 + 4 * lrStep,
                    y: tbS1 + 3 * tbStep
                }, {
                    x: lrS1 + 6 * lrStep,
                    y: tbS1 + 3 * tbStep
                }, {
                    x: lrS1 + 2 * lrStep,
                    y: tbS1 + 6 * tbStep
                }, {
                    x: lrS1 + 4 * lrStep,
                    y: tbS1 + 6 * tbStep
                }, {
                    x: lrS1 + 6 * lrStep,
                    y: tbS1 + 6 * tbStep
                }, ];
                for (var i in starPoint) {
                    drawStar(starPoint[i].x, starPoint[i].y, lrStep, tbStep, "");
                }
                drawStar(lrS1, tbS1 + 3 * tbStep, lrStep, tbStep, "right");
                drawStar(lrS1, tbS1 + 6 * tbStep, lrStep, tbStep, "right");
                drawStar(lrS1 + 8 * lrStep, tbS1 + 3 * tbStep, lrStep, tbStep, "left");
                drawStar(lrS1 + 8 * lrStep, tbS1 + 6 * tbStep, lrStep, tbStep, "left");
                drawLine(lrS1 + 3 * lrStep, tbS1, lrS1 + 5 * lrStep, tbS1 + 2 * tbStep);
                drawLine(lrS1 + 3 * lrStep, tbS1 + 2 * tbStep, lrS1 + 5 * lrStep, tbS1);
                drawLine(lrS1 + 3 * lrStep, tbS1 + 7 * tbStep, lrS1 + 5 * lrStep, tbS1 + 9 * tbStep);
                drawLine(lrS1 + 3 * lrStep, tbS1 + 9 * tbStep, lrS1 + 5 * lrStep, tbS1 + 7 * tbStep);
                drawWordInRiver();
                me.startX = lrS1;
                me.startY = tbS1;
                me.xStep = lrStep;
                me.yStep = tbStep;
            };
            /*
             * 绘制单个棋子
             */
            me.drawPiece = function(word, x, y, color, active) {
                me.piececxt.beginPath();
                if (active == true) {
                    me.piececxt.strokeStyle = "green";
                } else {
                    me.piececxt.strokeStyle = "black";
                }
                me.piececxt.fillStyle = "white";
                var r = me.getPiecesR();
                me.piececxt.lineWidth = 2;
                me.piececxt.arc(x, y, r, -3.14, 3.14, false);
                me.piececxt.fill();
                me.piececxt.fillStyle = color;
                me.piececxt.fillText(word, x, y);
                me.piececxt.stroke();

            };

            /*
             * 清空棋盘
             */
            me.erasePieces = function() {
                me.piececxt.clearRect(0, 0, me.boardWidth, me.boardHight);
                me.Piece()
            };

            /*
             * 初始化棋盘
             */
            me.initPieces = function() {
                me.drawChessBoard();
                var line = new Array();
                line[1] = ["",
                {
                    id: "r车",
                    text: "车"
                }, {
                    id: "r马",
                    text: "马"
                }, {
                    id: "r象",
                    text: "象"
                }, {
                    id: "r士",
                    text: "士"
                }, {
                    id: "将",
                    text: "将"
                }, {
                    id: "l士",
                    text: "士"
                }, {
                    id: "l象",
                    text: "象"
                }, {
                    id: "l马",
                    text: "马"
                }, {
                    id: "l车",
                    text: "车"
                }];
                line[3] = ["", "",
                {
                    id: "r炮",
                    text: "炮"
                }, "", "", "", "", "",
                {
                    id: "l炮",
                    text: "炮"
                }, ""];
                line[4] = ["",
                {
                    id: "r1卒",
                    text: "卒"
                }, "",
                {
                    id: "r2卒",
                    text: "卒"
                }, "",
                {
                    id: "卒",
                    text: "卒"
                }, "",
                {
                    id: "l2卒",
                    text: "卒"
                }, "",
                {
                    id: "l1卒",
                    text: "卒"
                }];
                line[7] = ["",
                {
                    id: "l1卒",
                    text: "兵"
                }, "",
                {
                    id: "l2卒",
                    text: "兵"
                }, "",
                {
                    id: "卒",
                    text: "兵"
                }, "",
                {
                    id: "r2卒",
                    text: "兵"
                }, "",
                {
                    id: "r1卒",
                    text: "兵"
                }];
                line[8] = ["", "",
                {
                    id: "l炮",
                    text: "炮"
                }, "", "", "", "", "",
                {
                    id: "r炮",
                    text: "炮"
                }, ""];
                line[10] = ["",
                {
                    id: "l车",
                    text: "俥"
                }, {
                    id: "l马",
                    text: "馬"
                }, {
                    id: "l象",
                    text: "相"
                }, {
                    id: "l士",
                    text: "仕"
                }, {
                    id: "将",
                    text: "帅"
                }, {
                    id: "r士",
                    text: "仕"
                }, {
                    id: "r象",
                    text: "相"
                }, {
                    id: "r马",
                    text: "馬"
                }, {
                    id: "r车",
                    text: "俥"
                }];
                for (var i in line) {
                    for (var j in line[i]) {
                        if (line[i][j] != "") {
                            var color = me.getOppositeColor();
                            var position = "opposite";
                            if (i > 5) {
                                color = me.getOurColor();
                                position = "our";
                            }
                            var peice = me.Piece(line[i][j].text, j, i, color);
                            var tmpPos = peice.getPos();
                            me.drawPiece(peice.role, tmpPos.x, tmpPos.y, color, false);
                            var index = line[i][j].id;
                            me.piecesList[position][index] = peice;
                        }
                    }
                }
                me.board = [
                    [],
                    ["", "opposite-r车", "opposite-r马", "opposite-r象", "opposite-r士", "opposite-将", "opposite-l士", "opposite-l象", "opposite-l马", "opposite-l车"],
                    ["", "", "", "", "", "", "", "", "", ""],
                    ["", "", "opposite-r炮", "", "", "", "", "", "opposite-l炮", ""],
                    ["", "opposite-r1卒", "", "opposite-r2卒", "", "opposite-卒", "", "opposite-l2卒", "", "opposite-l1卒"],
                    ["", "", "", "", "", "", "", "", "", ""],
                    ["", "", "", "", "", "", "", "", "", ""],
                    ["", "our-l1卒", "", "our-l2卒", "", "our-卒", "", "our-r2卒", "", "our-r1卒"],
                    ["", "", "our-l炮", "", "", "", "", "", "our-r炮", ""],
                    ["", "", "", "", "", "", "", "", "", ""],
                    ["", "our-l车", "our-l马", "our-l象", "our-l士", "our-将", "our-r士", "our-r象", "our-r马", "our-r车"]
                ];
                me.piecesCanvas.addEventListener("click", me.onClick, false);
            };

            /*
             * 移动棋子或者吃掉对方棋子
             */
            me.pieceMoveTo = function(position, piece, toX, toY) {
                var result = true;
                var pieceString = position + "-" + piece;
                var movedPiece = me.piecesList[position][piece];
                var thisX = movedPiece.lineX;
                var thisY = movedPiece.lineY;
                if (me.board[thisY][thisX] == pieceString) {
                    if (me.board[toY][toX] == "") {
                        me.piecesList[position][piece].moveToNew(toX, toY);
                        me.board[thisY][thisX] = "";
                        me.board[toY][toX] = pieceString;
                    } else {
                        //处理目的位置有棋子的情况，自己的不能动，对方的就吃掉
                        var toPieceArr = me.board[toY][toX].split("-");
                        var toPos = toPieceArr[0];
                        var toPiece = toPieceArr[1];
                        if ((position == 'our' && toPos == "opposite") || (position == 'opposite' && toPos == 'our')) {
                            //吃掉对方
                            me.piecesList[toPos][toPiece].alive = false;
                            me.piecesList[position][piece].moveToNew(toX, toY);
                            me.board[thisY][thisX] = "";
                            me.board[toY][toX] = pieceString;
                        } else {
                            result = false;
                        }
                    }
                } else {
                    result = false;
                }
                me.reDrawPieces();
                return result;
            };
            /*
             * 处理鼠标点击事件
             */
            me.onClick = function(e) {
                var x = e.clientX - me.startX - me.piecesCanvas.offsetLeft;
                var y = e.clientY - me.startY - me.piecesCanvas.offsetTop;
                var lineX = x / me.xStep;
                var lineY = y / me.yStep;
                lineX = parseInt(lineX + 1.5);
                lineY = parseInt(lineY + 1.5);
                var pX = (lineX - 1) * me.xStep;
                var pY = (lineY - 1) * me.yStep;
                var dist = Math.sqrt((x - pX) * (x - pX) + (y - pY) * (y - pY));
                var r = me.getPiecesR();
                if (dist < r) {
                    if (me.status == "idle") {
                        var selectPoint = me.board[lineY][lineX];
                        if (selectPoint == "") {
                            return;
                        } else {
                            var selectArr = selectPoint.split("-");
                            var position = selectArr[0];
                            var pieceStr = selectArr[1];
                            if (position == "our") {
                                me.activePiece = pieceStr;
                                me.piecesList["our"][pieceStr].active = true;
                                me.status = "active";
                                me.reDrawPieces();
                            }
                        }
                    } else if (me.status == "active") {
                        var selectPoint = me.board[lineY][lineX];

                        if (selectPoint == "") {
                            me.pieceMoveTo("our", me.activePiece, lineX, lineY);
                            var movement = {};
                            movement["piece"] = me.activePiece;
                            movement["toLineX"] = lineX;
                            movement["toLineY"] = lineY;
                            me.socket.emit('goChess', movement);
                            me.piecesList["our"][me.activePiece].active = false;
                            me.activePiece = "";
                            me.status = "wait";
                            me.reDrawPieces();

                        } else {
                            var selectArr = selectPoint.split("-");
                            var position = selectArr[0];
                            var pieceStr = selectArr[1];
                            if (position == "opposite") {
                                me.pieceMoveTo("our", me.activePiece, lineX, lineY);
                                var movement = {};
                                movement["piece"] = me.activePiece;
                                movement["toLineX"] = lineX;
                                movement["toLineY"] = lineY;
                                me.socket.emit('goChess', movement);
                                me.piecesList["our"][me.activePiece].active = false;
                                me.activePiece = "";
                                me.status = "wait";
                                me.reDrawPieces();
                            } else if (position == "our") {
                                me.piecesList["our"][me.activePiece].active = false;
                                me.piecesList["our"][pieceStr].active = true;
                                me.activePiece = pieceStr;
                                me.reDrawPieces();
                            }
                        }

                    }
                }
            };

            me.socket.on('comGoChess', function(movement) {
                var lineX = 10 - movement.toLineX;
                var lineY = 11 - movement.toLineY;
                var comPiece = movement.piece;
                me.pieceMoveTo('opposite', comPiece, lineX, lineY);
                me.status = 'idle';
            });


            /*
             * 重绘棋局中所有活着的棋子
             */
            me.reDrawPieces = function() {
                me.erasePieces();
                for (var i in me.piecesList) {
                    var colorP = me.piecesList[i];
                    for (var j in colorP) {
                        var tP = colorP[j];
                        if (tP.alive) {
                            var pos = tP.getPos();
                            me.drawPiece(tP.role, pos.x, pos.y, tP.color, tP.active);
                        }
                    }
                }
            };
            return me;
        };
    window.chess = chess;
})(window);
$(function() {
    $("#chessCanvas").hide();
    $("#PiecesCanvas").hide();
    $("#onlinelist").hide();
    socket = io.connect();
    window.submitUserName = function() {
        var userName = $("#username").val();
        if (userName) {
            socket.emit('submitUserName', userName, function(data) {
                if (data == "have") {
                    alert("用户名已经被使用，请重新取一个更酷的名字吧！");
                    $("#username").val("");
                    $("#username").focus();
                } else {
                    socket.emit('getOnlineList', userName, function(list) {
                        $.each(list, function(i, item) {
                            if (item == userName) {
                                return true;
                            }
                            var str = '<div id="' + item + '"><input type="radio" name="onlineuser" value="' + item + '" /><span>' + item + '</span></div>';
                            $("#namelist").append(str);
                        });
                        $("#login").hide();
                        $("#onlinelist").show();
                    });
                }
            });
            socket.on('addNewUserToList', function(data) {
                var str = '<div id="' + data + '"><input type="radio" name="onlineuser" value="' + data + '" /><span>' + data + '</span></div>';
                $("#namelist").append(str);
            });
            socket.on('deleteUserFromList', function(data) {
                $.each(data, function(i, item) {
                    $("#" + item).remove();
                });
            });
            socket.on('beginChess', function(data) {
                showChess('red', 'wait', socket);
            });
        } else {
            alert("请输入用户名！");
        }

    };
    window.beginChess = function() {
        var competitor = $("input[name='onlineuser']:checked").val();
        if (competitor) {
            socket.emit('setCompetitor', competitor, function(data) {
                if (data == "success") {
                    showChess('black', 'idle', socket);
                } else {
                    //未配对成功的情况
                }
            });
        } else {
            alert("请选择一个对手！");
        }
    };

    function showChess(ourColor, status, sock) {
        $("#onlinelist").hide();
        $("#chessCanvas").show();
        $("#PiecesCanvas").show();
        window.chss = chess("chessCanvas", "PiecesCanvas", sock);
        window.chss.ourColor = ourColor;
        window.chss.status = status;
        window.chss.initPieces();
    }

});