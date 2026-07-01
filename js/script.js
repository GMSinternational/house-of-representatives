let data = {};
let charts = {};
let gResults = [];

const init = () => {

  const HEADERS = [
    "議案種類",
    "提出回次",
    "番号",
    "議案件名",
    "審議回次",
    "審議状況",
    "議案提出者",
    "議案提出会派",
    "議案提出者一覧",
    "議案提出の賛成者"
  ];

  const KEIKA_HEADERS = [
    "審議回次",
    "審議状況",
    "経過情報",
    "経過情報URL",
    "本文情報",
    "本文情報URL",
    "議案種類",
    "衆議院予備審査議案受理年月日",
    "衆議院予備付託年月日／衆議院予備付託委員会",
    "衆議院議案受理年月日",
    "衆議院付託年月日／衆議院付託委員会",
    "衆議院審査終了年月日／衆議院審査結果",
    "衆議院審議終了年月日／衆議院審議結果",
    "衆議院審議時会派態度",
    "衆議院審議時賛成会派",
    "衆議院審議時反対会派",
    "参議院予備審査議案受理年月日",
    "参議院予備付託年月日／参議院予備付託委員会",
    "参議院議案受理年月日",
    "参議院付託年月日／参議院付託委員会",
    "参議院審査終了年月日／参議院審査結果",
    "参議院審議終了年月日／参議院審議結果",
    "公布年月日／法律番号"
  ];

  const KEYWORDS = [
    "ロシア","東日本大震災","新型コロナ","消費税","年金","エネルギー","学校","復興","ウイルス","銀行","郵政","脱税","アメリカ","土地","海上","図書館","関税","大学","子ども","憲法","高齢","漁業","東京","衛生","食品","建築","保育","電波","住宅","科学","証券","沖縄","家族","検察","農林","燃料","農地","土砂","輸出","スポーツ","国土","教職員","警備","預金","貯金","北海道","鉄道","青少年","インフルエンザ","消防","港湾","医薬","家畜","インド","オリンピック","畜産","患者","テロ","牛肉","鳥獣","衛星","インターネット","扶養","子育て","駐留","減税","社会保険料","規制"
  ];

  const PARTIES = [
    ["自由民主党","立憲民主党","日本維新の会","公明党","国民民主党","日本共産党","れいわ新選組"],
    ["民主党","社会民主党","自由党","希望の党","民進党","生活の党"]
  ];

  const COMMITTEE_NORMALIZE = {
    // 参議院：中点あり/なしの表記ゆれ（同一委員会）
    "外交・防衛":  "外交防衛",
    "財政・金融":  "財政金融",
    "経済・産業":  "経済産業",
    "文教・科学":  "文教科学",
    // 衆議院：末尾スペース
    "決算行政監視 ": "決算行政監視",
    // 略称（データのノイズ）
    "議運":        "議院運営",
    "農水":        "農林水産",
    "災害特":      "災害対策特別",
    "倫理選挙特":  "政治倫理の確立及び選挙制度に関する特別",
  };

  const normalizeCommittee = (name) => COMMITTEE_NORMALIZE[name] || name;

  const addCommas = (num) => {
    return String(num).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
  }

  const loadData = () => {

    const showData = () => {

      const getParams = (array, dom_id) => {

        // Sort ascending
        let array2 = Object.keys(array).map((k)=>({key: k, value: array[k]}));
        array2.sort((a, b) => a.value - b.value);
        array = Object.assign({}, ...array2.map((item) => ({
          [item.key]: item.value,
        })));

        config_data = [];
        config_labels = [];

        for (let key in array) {
          config_data.push(array[key]);
          config_labels.push(key);
        }

        const params = {
          domid: dom_id,
          labels: config_labels,
          datasets: [{
            name: '',
            data: config_data
          }]
        };

        return params;
      }

      const drawChart = (params) => {
        const $wrapper = $("#" + params.domid);
        const $inner = $wrapper.find(".inner")[0];

        $inner.style.height = 20 + (params.datasets[0].data.length * 20) + "px";
        if (params.domid === "summary-chart-foragainst") $inner.style.height = parseInt($inner.style.height.replace("px", "")) * 1.2 + "px";

        const myChart = echarts.init($inner);
        let option = {
          legend: {
            show: ((params.datasets.length >= 2) ? true: false)
          },
          grid: {
            top: ((params.datasets.length >= 2) ? '40px': '0'),
            left: '3%',
            right: '6%',
            bottom: '3%',
            containLabel: true
          },
          tooltip: {
            show: true,
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            },
            alwaysShowContent: true,
            className: 'echarts-tooltip',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderWidth: 0,
            padding: [8, 16],
            textStyle: {
              color: "#fefefe",
              fontSize: 13,
              fontFamily: "Roboto"
            },
            formatter: ((d) => {
              //console.log(d);
              let title = params.labels[d[0].dataIndex];
                if ((params.domid === "summary-chart-committee")
                    &&  (title.substr(-3) !== "審査会")
                    &&  (title !== "審査省略要求")
                  ) {
                    title += "委員会";
                  }
              let value = addCommas(d[0].value);

              let ret = title;
              d.map((r, i) => {
                let prefix = (params.datasets[i].name !== "") ? params.datasets[i].name + "：": "";
                ret += "<br>" + prefix + "<span>" + addCommas(r.value) + "</span> 件";
                if (params.domid === "summary-chart-foragainst") {
                  const total = d.reduce((g, e) => g + e.value, 0);
                  ret += "（" + ((r.value * 100) / total).toFixed(1) + "％）"
                }
              });
              return ret;
            })
          },
          xAxis: {
            type: 'value',
            position: 'top',
            splitNumber: 4,
            splitLine: {
              show: true,
              lineStyle: {
                color: '#ccc',
                //miterLimit: 2
              }
            },
            axisLabel: {
              fontFamily: "Roboto",
              formatter: ((d) => {
                return addCommas(d);
              })
            }
          },
          yAxis: {
            type: 'category',
            data: params.labels.map((label) => {
              const MAX_LABEL_LENGTH = 8;
              let ret = label;
              if (label.length >= MAX_LABEL_LENGTH) ret = label.slice(0, MAX_LABEL_LENGTH - 1) + "…";
              return ret;
            })
          },
          series: []
        };

        params.datasets.map((dataset, i) => {
          option.series.push({
            name: dataset.name,
            type: 'bar',
            stack: 'total',
            label: {
              show: (params.datasets.length === 1) ? true: false,
              position: "right",
              textBorderColor: "#fff",
              textBorderWidth: 0,
              color: "#47a",
              fontFamily: "Roboto",
              formatter: ((d) => {
                return addCommas(d.data);
              })
            },
            itemStyle: {
              color: (i === 0) ? "#47a": "#f5d25f"
            },
            data: dataset.data
          });
        });

        myChart.setOption(option);
      }

      const updateSelectBox = (file_name, select_id) => {
        const $select = $("#" + select_id);
        for (let key in data[file_name]) {
          const option = '<option value="' + key + '">' + data[file_name][key] + '</option>';
          $select.append(option);
        }
      }

      const updateSelectBoxParties = (select_id) => {
        const $select = $("#" + select_id);
        const all = {};
        data.gian_summary.forEach(gian => {
          gian[10].forEach(keika => {
            [keika[14], keika[15]].forEach(field => {
              if (!field) return;
              field.split(/;\s?/).forEach(p => {
                p = p.trim();
                if (p) all[p] = true;
              });
            });
          });
        });
        Object.keys(all).sort((a, b) => a.localeCompare(b, "ja")).forEach(name => {
          $select.append('<option value="' + name + '">' + name + '</option>');
        });
      }

      const updateSelectBoxStatuses = () => {
        const POSITIVE = ["成立","両院承認","本院議了","本院可決","両院承諾","参議院回付案（同意）","参議院議了","承認","両院議決","修正承諾","衆議院回付案（同意）","衆議院で併合修正","本院修正議決","議決不要"];
        const ONGOING  = ["衆議院で審議中","参議院で審議中","衆議院で閉会中審査","参議院で閉会中審査","閉会中審査","中間報告","衆議院議決案（可決）","両院の意見が一致しない旨報告"];
        const NEGATIVE = ["未了","撤回","承諾なし","撤回承諾","参議院回付案（不同意）"];

        const $select = $("#select-gian-status");
        const all = {};
        for (let key in data.gian_status) {
          if (data.gian_status[key]) all[data.gian_status[key]] = key;
        }
        const groups = [
          { label: "成立・可決・承認", list: POSITIVE },
          { label: "審議継続中", list: ONGOING },
          { label: "否決・廃案・撤回", list: NEGATIVE },
        ];
        const used = new Set();
        groups.forEach(({ label, list }) => {
          const items = list.filter(v => all[v]);
          if (items.length === 0) return;
          $select.append('<optgroup label="' + label + '"></optgroup>');
          items.forEach(v => {
            $select.find("optgroup:last").append('<option value="' + all[v] + '">' + v + '</option>');
            used.add(v);
          });
        });
        Object.values(data.gian_status).filter(v => v && !used.has(v)).forEach(v => {
          const key = all[v];
          $select.append('<option value="' + key + '">' + v + '</option>');
        });
      }

      const updateSelectBoxSubmitterParties = () => {
        const $select = $("#select-gian-submitter-party");
        const all = {};
        data.gian_summary.forEach(gian => {
          if (!gian[7]) return;
          gian[7].split(/;\s?/).forEach(p => {
            p = p.trim();
            if (p) all[p] = true;
          });
        });
        Object.keys(all).sort((a, b) => a.localeCompare(b, "ja")).forEach(name => {
          $select.append('<option value="' + name + '">' + name + '</option>');
        });
      }

      const updateSelectBoxKaiji = () => {
        let kaijiSubmit = {};
        let kaijiAny = {};

        data.gian_summary.map(gian => {
          if (gian[1] !== "") kaijiSubmit[gian[1]] = true;
          gian[10].map(keika => {
            if (keika[0] !== "") kaijiAny[keika[0]] = true;
          });
        });

        const sortDesc = (obj) => {
          return Object.keys(obj).map(k => parseInt(k, 10)).filter(n => !isNaN(n)).sort((a, b) => b - a);
        }

        const fill = (select_id, list) => {
          const $select = $("#" + select_id);
          list.map(n => {
            $select.append('<option value="' + n + '">第' + n + '回国会</option>');
          });
        }

        fill("select-kaiji-submit", sortDesc(kaijiSubmit));
        fill("select-kaiji-any", sortDesc(kaijiAny));
      }

      // 「平成10年 3月 4日」のような元号表記の日付文字列を西暦の年（数値）に変換する
      const eraToYear = (str) => {
        if (typeof str !== "string") return null;
        const ERA_BASE = { "明治": 1867, "大正": 1911, "昭和": 1925, "平成": 1988, "令和": 2018 };
        const m = str.match(/^(明治|大正|昭和|平成|令和)\s*(\d+|元)年/);
        if (!m) return null;
        const n = m[2] === "元" ? 1 : parseInt(m[2], 10);
        return ERA_BASE[m[1]] + n;
      }

      // 「日付／委員会名」「日付／結果」のような列から、最後の／以降の値だけを取り出す
      const getAfterSlash = (str) => {
        if (typeof str !== "string" || str.indexOf("／") === -1) return "";
        const parts = str.split("／");
        return parts[parts.length - 1];
      }

      const updateSelectBoxCommittees = () => {
        const OTHER_NAMES = new Set(["審査省略","審査省略要求","憲法審査会"]);
        const isSpecial = (name) => name.indexOf("特別") !== -1 || name.indexOf("調査特別") !== -1;
        const isOther   = (name) => OTHER_NAMES.has(name);

        const fill = (select_id, names) => {
          const $select = $("#" + select_id);
          const joninNames  = names.filter(n => !isSpecial(n) && !isOther(n)).sort((a, b) => a.localeCompare(b, "ja"));
          const tokuNames   = names.filter(n =>  isSpecial(n)).sort((a, b) => a.localeCompare(b, "ja"));
          const otherNames  = names.filter(n =>  isOther(n)).sort((a, b) => a.localeCompare(b, "ja"));

          const addGroup = (label, list, suffix) => {
            if (list.length === 0) return;
            $select.append('<optgroup label="' + label + '"></optgroup>');
            list.forEach(name => {
              const display = name + (suffix && !isOther(name) ? suffix : "");
              $select.find("optgroup:last").append('<option value="' + name + '">' + display + '</option>');
            });
          };
          addGroup("常任委員会", joninNames, "委員会");
          addGroup("特別委員会", tokuNames, "");
          addGroup("その他", otherNames, "");
        };

        let shu = {};
        let san = {};
        data.gian_summary.map(gian => {
          gian[10].map(keika => {
            const c1 = normalizeCommittee(getAfterSlash(keika[10]));
            const c2 = normalizeCommittee(getAfterSlash(keika[19]));
            if (c1 !== "") shu[c1] = true;
            if (c2 !== "") san[c2] = true;
          });
        });

        fill("select-shugiin-committee", Object.keys(shu));
        fill("select-sangiin-committee", Object.keys(san));
      }

      const updateSelectBoxSubmitYears = () => {
        let years = {};

        data.gian_summary.map(gian => {
          gian[10].map(keika => {
            // 衆議院議案受理年月日を優先し、無ければ衆議院予備審査議案受理年月日を使う
            const y = eraToYear(keika[9]) || eraToYear(keika[7]);
            if (y) years[y] = true;
          });
        });

        const $select = $("#select-submit-year");
        Object.keys(years).map(y => parseInt(y, 10)).sort((a, b) => b - a).map(y => {
          $select.append('<option value="' + y + '">' + y + '年</option>');
        });
      }

      const showLatestStatus = () => {
        let statuses = {};

        data.gian_summary.map(gian => {
          const status = gian[5];
          if (status !== "") {
            if (!statuses[status]) {
              statuses[status] = 0;
            }
            statuses[status] += 1;
          }
        });

        drawChart(getParams(statuses, 'summary-chart-status'));
      }

      const showCommittees = () => {
        let committees = {};

        data.gian_summary.map(gian => {
          gian[10].map(info => {
            const cominfo = info[10];
            if (cominfo.indexOf("／") !== -1) {
              const name = cominfo.split("／")[1];
              if (name !== "" && name !== "審査省略") {
                if (!committees[name]) {
                  committees[name] = 0;
                }
                committees[name] += 1;
              }
            }
          });
        });

        drawChart(getParams(committees, 'summary-chart-committee'));
      }

      const showSubmitters = () => {
        let submitters = {};

        data.gian_summary.map(gian => {
          let name = gian[6];

          if (name.indexOf("君外") !== -1) {
            name = name.split("君外")[0].replace("　", " ");
          }

          if (name.slice(-1) === "君") {
            name = name.substr(0, -1).replace("　", " ");
          }

          if (name !== "") {
            if (!submitters[name]) {
              submitters[name] = 0;
            }
            submitters[name] += 1;
          }
        });

        let submitters2 = {};
        for (let key in submitters) {
          const s = submitters[key];
          if (s >= 5) submitters2[key] = s;
        }

        drawChart(getParams(submitters2, 'summary-chart-submitter'));
      }

      const showForAgainst = () => {
        let parties = {};

        PARTIES.map((ps) => {
          ps.map((p) => {
            parties[p] = [0, 0];
          });
        });

        data.gian_summary.map(gian => {
          gian[10].map(row => {
            if (row[14] != "") {
              [row[14], row[15]].map((fas, j) => {
                fas = fas.replaceAll("; ", "／");
                fas = fas.replaceAll(";", "／");
                fas = fas.replaceAll("・", "／");
                fas.split("／").map((party) => {
                  if (party in parties) {
                    parties[party][j] += 1;
                  }
                });
              });
            }
          });
        });

        let array2 = Object.keys(parties).map((k)=>({key: k, for: parties[k][0], agn: parties[k][1]}));
        array2.sort((a, b) => (a.for + a.agn) - (b.for + b.agn));
        parties = Object.assign({}, ...array2.map((item) => ({
          [item.key]: [item.for, item.agn],
        })));

        config_data = [[],[]];
        config_labels = [];

        for (let key in parties) {
          config_data[0].push(parties[key][0]);
          config_data[1].push(parties[key][1]);
          config_labels.push(key);
        }
        //console.log(submitters);

        drawChart({
          domid: 'summary-chart-foragainst',
          labels: config_labels,
          datasets: [{
            name: '賛成',
            data: config_data[0]
          },{
            name: '反対',
            data: config_data[1]
          }]
        });
      }

      const showTypes = () => {
        let types = {};
        data.gian_summary.map(gian => {
          const t = gian[0];
          if (t !== "") {
            types[t] = (types[t] || 0) + 1;
          }
        });
        drawChart(getParams(types, 'summary-chart-type'));
      }

      const showPartiesNote = () => {
        const all = new Set();
        data.gian_summary.forEach(gian => {
          gian[10].forEach(keika => {
            [keika[14], keika[15]].forEach(field => {
              if (!field) return;
              field.split(/;\s?/).forEach(p => {
                p = p.trim();
                if (p && p.indexOf("・") !== -1) all.add(p);
              });
            });
          });
        });
        const names = Array.from(all).sort((a, b) => a.localeCompare(b, "ja"));
        if (names.length === 0) return;
        const $section = $("#parties-note-block");
        $section.append('<h2><div class="icon info"></div>会派名について</h2>');
        $section.append('<div class="box sn-color"></div>');
        $section.append('<p>「会派（政党）別の賛否」検索で使用する会派名は、衆議院公式データに記載された表記をそのまま使用しています。以下の会派は複数政党や無所属議員による合同会派です。</p>');
        let html = '<ul style="margin-top:8px">';
        names.forEach(n => { html += '<li style="font-size:14px;color:#555;padding:2px 0">' + n + '</li>'; });
        html += '</ul>';
        $section.append(html);
      }

      const updateKeywords = () => {
        const KEYWORDS_NUM = Math.min(KEYWORDS.length, 6);
        let copy = KEYWORDS.map(d => {
          return d;
        });
        for (let i = 0; i < KEYWORDS_NUM; i++) {
          const j = Math.floor(Math.random() * (KEYWORDS.length - i)); // Between 0 and (KEYWORDS_NUM - 1)
          $("#keywords").append('<a href="">' + copy[j] + '</a>｜');
          copy.splice(j, 1);
        }

        $("#keywords").find("a").on("click", function(e){
          e.preventDefault();
          $("#input-gian-title").val($(this).text());
          $("#form-gian-search").submit();
        });
      }

      updateSelectBox("gian_type", "select-gian-type");
      updateSelectBoxStatuses();
      updateSelectBoxParties("select-party-for");
      updateSelectBoxParties("select-party-against");
      updateSelectBoxSubmitterParties();
      updateSelectBoxKaiji();
      updateSelectBoxCommittees();
      updateSelectBoxSubmitYears();

      showLatestStatus();
      showCommittees();
      showSubmitters();
      showForAgainst();
      showTypes();
      showPartiesNote();

      updateKeywords();

      $("#cover").fadeOut();

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.toString() !== '') {
        const getP = (key) => urlParams.get(key) || '';
        if (getP('title')) $("#input-gian-title").val(getP('title'));
        if (getP('session')) $("#input-gian-session").val(getP('session'));
        if (getP('number')) $("#input-gian-number").val(getP('number'));
        if (getP('title-mode') === 'or') $("input[name='title-mode'][value='or']").prop('checked', true);
        if (getP('type')) $("#select-gian-type").val(getP('type'));
        if (getP('status')) $("#select-gian-status").val(getP('status'));
        if (getP('submitter')) $("#input-gian-submitter").val(getP('submitter'));
        if (getP('submitter-party')) $("#select-gian-submitter-party").val(getP('submitter-party'));
        if (getP('submitter-kind')) $("#select-submitter-kind").val(getP('submitter-kind'));
        if (getP('kaiji-submit')) $("#select-kaiji-submit").val(getP('kaiji-submit'));
        if (getP('submit-year')) $("#select-submit-year").val(getP('submit-year'));
        if (getP('kaiji-any')) $("#select-kaiji-any").val(getP('kaiji-any'));
        if (getP('shugiin-committee')) $("#select-shugiin-committee").val(getP('shugiin-committee'));
        if (getP('shugiin-shinsa')) $("#select-shugiin-shinsa").val(getP('shugiin-shinsa'));
        if (getP('shugiin-shingi')) $("#select-shugiin-shingi").val(getP('shugiin-shingi'));
        if (getP('shugiin-taido')) $("#select-shugiin-taido").val(getP('shugiin-taido'));
        if (getP('party-for')) $("#select-party-for").val(getP('party-for'));
        if (getP('party-against')) $("#select-party-against").val(getP('party-against'));
        if (getP('sangiin-committee')) $("#select-sangiin-committee").val(getP('sangiin-committee'));
        if (getP('sangiin-shinsa')) $("#select-sangiin-shinsa").val(getP('sangiin-shinsa'));
        if (getP('sangiin-shingi')) $("#select-sangiin-shingi").val(getP('sangiin-shingi'));
        if (getP('horei')) $("#input-horei").val(getP('horei'));
        $("#switch").find('.switch-item[code="search"]').trigger('click');
        $("#form-gian-search").submit();
      }
    }

    const updateData = (updatetime) => {

      let count = 0;

      const targets = [
        "updatetime",
        "gian_type",
        "gian_status",
        "gian_summary"
      ];

      targets.map((target) => {
        $.getJSON("data/" + target + ".json", function(json){
          data[target] = json;
          count++;
          if (count >= targets.length) {
            showData();
          }
        });
      });
    }

    if (localStorage.getItem('gamishi-gian')) {
      data = localStorage.getItem('gamishi-gian');
      $.getJSON("data/updatetime.json", function(updatetime){
        let t1 = new Date(updatetime.file_update);
        let t2 = new Date(data.updatetime.file_update);
        if (t1 > t2) {
          updateData();
        } else {
          showData();
        }
      });
    } else {
      updateData();
    }
  }

  const showSingleGian = (index) => {
    const $inner = $("#single-gian-content-inner");
    const $keika = $("#single-gian-content-keika").empty();
    const gian = data.gian_summary[parseInt(index)];

    $inner.find("h3").text(gian[3]);
    $("#ul-single-gian-items").empty();

    [0,1,2,4,5,6,7,8,9].map(i => {
      const header = HEADERS[i];
      const value = gian[i];

      const li =  '<li>'
                  + '<div>' + header + '</div>'
                  + '<div>' + value + '</div>'
                + '</li>';

      $("#ul-single-gian-items").append(li);
    });

    gian[10].map(keika => {
      $keika.append('<h4>第' + keika[0] + '回の経過情報</h4>');
      $keika.append('<ul class="keika"></ul>');
      $ul = $keika.find('ul.keika:last');

      for (let i = 1; i < keika.length; i++) {
        let value = keika[i];

        if (i === 2 || i === 4) {
          const url = keika[i + 1];
          if (url.slice(0, 8) === "https://") {
            value = '<a href="' + url + '" target="_blank">' + value + 'へのリンク</a>';
          }
        } else if (i === 3 || i === 5) {
          continue;
        }

        const li =  '<li>'
                    + '<div>' + KEIKA_HEADERS[i] + '</div>'
                    + '<div>' + value + '</div>'
                  + '</li>';

        $ul.append(li);
      }
    });

    $("body").addClass("single-gian-show");
  }

  const bindEvents = () => {

    const matchText = (input, haystack, mode) => {

      const unifyString = (str) => {
        let ret = str;

        // Convert Hiragana into Katakana
        ret = str.replace(/[\u3041-\u3096]/g, function(match) {
          var chr = match.charCodeAt(0) + 0x60;
          return String.fromCharCode(chr);
        });

        // Convert full-width characters into half-width
        ret = ret.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        });

        return ret;
      }

      input = unifyString(input);
      haystack = unifyString(haystack);

      const DELIMITERS = ["　", " ", ","];
      const DELIMITER = "／／";

      DELIMITERS.map(d => {
        input = input.replace(d, DELIMITER);
        haystack = haystack.replace(d, "");
      });

      const words = input.split(DELIMITER).filter(w => w !== "");
      if (words.length === 0) return true;

      if (mode === "or") {
        return words.some((w) => haystack.indexOf(w) !== -1);
      }

      let match = true;
      words.map((w) => {
        if (haystack.indexOf(w) === -1) match = false;
      });

      return match;
    }

    const matchParty = (input, haystack) => {
      if (input == "") return true;
      if (haystack == "") return false;
      const parties = haystack.split(/;\s?/).map(p => p.trim());
      return parties.indexOf(input) !== -1;
    }

    const matchSubmitterParty = (input, haystack) => {
      if (input === "") return true;
      if (!haystack) return false;
      const parties = haystack.split(/;\s?/).map(p => p.trim());
      return parties.indexOf(input) !== -1;
    }

    // 「日付／委員会名」「日付／結果」のような列から、最後の／以降の値だけを取り出す
    const getAfterSlash = (str) => {
      if (typeof str !== "string" || str.indexOf("／") === -1) return "";
      const parts = str.split("／");
      return parts[parts.length - 1];
    }

    // 経過情報（複数の国会回次にまたがりうる）のいずれかの行が条件に一致すればヒットとする
    const matchSomeKeika = (input, gian, getter) => {
      if (input === "") return true;
      return gian[10].some(keika => matchText(input, getter(keika)));
    }

    // 国会回次（セレクトボックスの値）が、いずれかの経過情報の回次に一致すればヒットとする
    const matchAnyKaiji = (input, gian) => {
      if (input === "") return true;
      return gian[10].some(keika => keika[0] === input);
    }

    // 議案提出者の表記から提出区分を判定する
    const matchSubmitterKind = (kind, submitterName) => {
      if (kind === "") return true;
      const isCabinet   = submitterName === "内閣";
      const isCommittee = !isCabinet && (submitterName.indexOf("委員長") !== -1 || submitterName.indexOf("調査会長") !== -1);
      const isMember    = !isCabinet && !isCommittee && (submitterName.slice(-1) === "君" || submitterName.indexOf("君外") !== -1);
      if (kind === "cabinet")    return isCabinet;
      if (kind === "committee")  return isCommittee;
      if (kind === "member")     return isMember;
      return true;
    }

    // 「平成10年 3月 4日」のような元号表記の日付文字列を西暦の年（数値）に変換する
    const eraToYear = (str) => {
      if (typeof str !== "string") return null;
      const ERA_BASE = { "明治": 1867, "大正": 1911, "昭和": 1925, "平成": 1988, "令和": 2018 };
      const m = str.match(/^(明治|大正|昭和|平成|令和)\s*(\d+|元)年/);
      if (!m) return null;
      const n = m[2] === "元" ? 1 : parseInt(m[2], 10);
      return ERA_BASE[m[1]] + n;
    }

    const matchSubmitYear = (input, gian) => {
      if (input === "") return true;
      const target = parseInt(input, 10);
      return gian[10].some(keika => {
        const y = eraToYear(keika[9]) || eraToYear(keika[7]);
        return y === target;
      });
    }

    $("#form-gian-search").on("submit", function(e){

      e.preventDefault();
      $("#ul-gian-list").empty();

      let gian_results = 0;
      let keika_results = 0;
      let type   = $("#select-gian-type").find("option:selected").text();
      let status = $("#select-gian-status").find("option:selected").text();
      if (type   === "指定なし") type   = "";
      if (status === "指定なし") status = "";
      const title = $("#input-gian-title").val();
      const gianSession = $("#input-gian-session").val().trim();
      const gianNumber = $("#input-gian-number").val().trim();
      const submitter = $("#input-gian-submitter").val();
      const submitterParty = $("#select-gian-submitter-party").val();
      const submitterKind = $("#select-submitter-kind").val();
      const party_f = $("#select-party-for").val();
      const party_a = $("#select-party-against").val();
      const kaijiSubmit = $("#select-kaiji-submit").val();
      const kaijiAny = $("#select-kaiji-any").val();
      const submitYear = $("#select-submit-year").val();
      const titleMode = $("input[name='title-mode']:checked").val();
      const shugiinCommittee = $("#select-shugiin-committee").val();
      const shugiinShinsa = $("#select-shugiin-shinsa").val();
      const shugiinShingi = $("#select-shugiin-shingi").val();
      const shugiinTaido = $("#select-shugiin-taido").val();
      const sangiinCommittee = $("#select-sangiin-committee").val();
      const sangiinShinsa = $("#select-sangiin-shinsa").val();
      const sangiinShingi = $("#select-sangiin-shingi").val();
      const horei = $("#input-horei").val();
      const MAX_RESULTS = 1000;
      gResults = [];

      for (let i = 0; i < data.gian_summary.length; i++) {
        const gian = data.gian_summary[i];

        let hit = true;

        hit = matchText(title, gian[3], titleMode);

        if (gianSession !== '' && gian[1] !== gianSession) hit = false;
        if (gianNumber !== '' && gian[2] !== gianNumber) hit = false;
        if (!matchText(submitter, gian[6])) hit = false;
        if (!matchSubmitterParty(submitterParty, gian[7])) hit = false;
        if (!matchSubmitterKind(submitterKind, gian[6])) hit = false;
        if (gian[0].indexOf(type) === -1) hit = false;
        if (gian[5].indexOf(status) === -1) hit = false;

        if (kaijiSubmit !== "" && gian[1] !== kaijiSubmit) hit = false;
        if (!matchAnyKaiji(kaijiAny, gian)) hit = false;
        if (!matchSubmitYear(submitYear, gian)) hit = false;

        if (!matchSomeKeika(shugiinCommittee, gian, (k) => normalizeCommittee(getAfterSlash(k[10])))) hit = false;
        if (!matchSomeKeika(shugiinShinsa,    gian, (k) => getAfterSlash(k[11]))) hit = false;
        if (!matchSomeKeika(shugiinShingi,    gian, (k) => getAfterSlash(k[12]))) hit = false;
        if (!matchSomeKeika(shugiinTaido,     gian, (k) => k[13])) hit = false;
        if (!matchSomeKeika(sangiinCommittee, gian, (k) => normalizeCommittee(getAfterSlash(k[19])))) hit = false;
        if (!matchSomeKeika(sangiinShinsa,    gian, (k) => getAfterSlash(k[20]))) hit = false;
        if (!matchSomeKeika(sangiinShingi,    gian, (k) => getAfterSlash(k[21]))) hit = false;
        if (!matchSomeKeika(horei,            gian, (k) => k[22])) hit = false;

        gian[10].map(keika => {
          if (!matchParty(party_f, keika[14])) hit = false;
          if (!matchParty(party_a, keika[15])) hit = false;
        });

        if (hit) {
          gian_results  += 1;
          keika_results += gian[10].length;
          gResults.push(gian);

          if (gian_results <= MAX_RESULTS) {
            const li =  '<li index="' + i + '">'
                        + '<div><span>第' + gian[4] + '回国会</span> ' + gian[5] + '</div>'
                        + '<div>' + gian[3] + '</div>'
                        + '<div>提出：第' + gian[1] + '回国会｜' + gian[0] + '</div>'
                      + '</li>';
            $("#ul-gian-list").append(li);
          }
        }
      }

      if (gian_results > MAX_RESULTS) {
        $("#result-number").text(addCommas(gian_results) + "件ヒットしました。" + addCommas(MAX_RESULTS) + "件までを表示しています。");
      } else if (gian_results === 0) {
        $("#result-number").text("該当する議案がありませんでした。");
      } else {
        $("#result-number").text(addCommas(gian_results) + "件ヒットしました。");
      }

      if (gian_results === 0) {
        $("#download-result").text("");
      } else {
        $("#download-result").text("検索結果（途中経過含め" + keika_results + "件）をCSVでダウンロードする");
      }


      const qp = new URLSearchParams();
      const setP = (key, val) => { if (val !== '') qp.set(key, val); };
      setP('title', title);
      setP('session', gianSession);
      setP('number', gianNumber);
      if (titleMode === 'or') qp.set('title-mode', 'or');
      setP('type', $("#select-gian-type").val());
      setP('status', $("#select-gian-status").val());
      setP('submitter', submitter);
      setP('submitter-party', submitterParty);
      setP('submitter-kind', submitterKind);
      setP('kaiji-submit', kaijiSubmit);
      setP('submit-year', submitYear);
      setP('kaiji-any', kaijiAny);
      setP('shugiin-committee', shugiinCommittee);
      setP('shugiin-shinsa', shugiinShinsa);
      setP('shugiin-shingi', shugiinShingi);
      setP('shugiin-taido', shugiinTaido);
      setP('party-for', party_f);
      setP('party-against', party_a);
      setP('sangiin-committee', sangiinCommittee);
      setP('sangiin-shinsa', sangiinShinsa);
      setP('sangiin-shingi', sangiinShingi);
      setP('horei', horei);
      const qs = qp.toString();
      history.pushState(null, '', qs ? '?' + qs : window.location.pathname);

      $("li").on("click", function(){
        showSingleGian($(this).attr("index"));
      });
    });

    $("#single-gian-cover").on("click", function(){
      $("body").removeClass("single-gian-show");
    });

    $("#single-gian-button-close").on("click", function(){
      $("body").removeClass("single-gian-show");
    });

    $("#switch").find(".switch-item").on("click", function(){
      if (!$(this).hasClass("selected")) {
        $(this).siblings(".switch-item").removeClass("selected");
        $(this).addClass("selected");

        $("#switch").find(".switch-item").each(function(){
          let code = $(this).attr("code");
          if ($(this).hasClass("selected")) {
            $("#" + code + "-block").addClass("show");
          } else {
            $("#" + code + "-block").removeClass("show");
          }

          $('body, html').scrollTop(0);
        });
      }
    });

    $("#download-result").on("click", function(e){
      e.preventDefault();

      const getResultsToArray = () => {
        let headers = HEADERS.concat(KEIKA_HEADERS);
        headers.splice(4, 2);
        let data = headers.join(",") + "\n";

        gResults.map(row => {
          row[10].map((keikarow, i) => {
            data += [row[0], row[1], row[2], row[3], row[6], row[7], row[8], row[9]].join(",") + "," + keikarow.join(",") + "\n";
          });
        });

        return data;
      }

      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth()+1;
      const d = now.getDate();
      const h = now.getHours();
      const n = now.getMinutes();
      const s = now.getSeconds();
      const data = getResultsToArray();
      const filename = "gamishi-house-of-representatives-" + y + m + d + h + n + s + ".csv";
      const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
      const blob = new Blob([bom, data], {type: "text/csv"});

      if (window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(blob, filename);
      } else {
        const url = (window.URL || window.webkitURL).createObjectURL(blob);
        const d = document.createElement("a");
        d.href = url;
        d.download = filename;
        d.click();
        (window.URL || window.webkitURL).revokeObjectURL(url);
      }
    });

    $("#social-button-copy").on("click", function(e){
      e.preventDefault();
      let text = "国会議案データベース - ガミシ\nhttps://gmsinternational.github.io/house-of-representatives/";
      let $textarea = $('<textarea></textarea>');
      $textarea.text(text);
      $(this).append($textarea);
      $textarea.select();
      document.execCommand('copy');
      $textarea.remove();
      let $copyText = $(this).next(".text-copy");
      $copyText.addClass("copied");

      setTimeout(function() {
        $copyText.removeClass("copied");
      }, 3000);
    });
  }

  loadData();
  bindEvents();
}


$(function(){
  init();
});
