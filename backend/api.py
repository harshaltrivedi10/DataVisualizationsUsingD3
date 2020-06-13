#! /usr/bin/python3

from flask import Flask, jsonify, make_response, request
from flask_restful import Resource, Api
import json
from csvGenerator import dap_manip
import os
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from ccpca import CCPCA
from opt_sign_flip import OptSignFlip
from mat_reorder import MatReorder

app = Flask(__name__)
api = Api(app)

@app.route("/addCluster", methods=['GET', 'POST'])
def addClusters():
    data = request.data
    # print(data)
    fileName = request.args.get('dataset')
    #read and parse json
    parsed_json = (json.loads(data))
    print(json.dumps(parsed_json, indent=4, sort_keys=True))
    filePath = "../data/"+fileName
    print(filePath)
    # print(type(parsed_json))
    dm = dap_manip()
    dm.data_updater(parsed_json,filePath)

    dataset_name = fileName + "_updated"
    getHeatmap(dataset_name)
    #construct response
    res = ["Request Handleled successfully"]
    resp = make_response(jsonify(res))

    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Methods'] = '*'


    return resp


@app.route("/", methods=['GET', 'POST'])
def initialRequest():
    if os.path.exists("../data/crime_updated.csv"):
        os.remove("../data/crime_updated.csv")
    if os.path.exists("../data/nutrients_updated.csv"):
        os.remove("../data/nutrients_updated.csv")
    if os.path.exists("../data/tennis_women_updated.csv"):
        os.remove("../data/tennis_women_updated.csv")
    if os.path.exists("../data/wine_updated.csv"):
        os.remove("../data/wine_updated.csv")
    res = ["Request Handleled successfully"]
    resp = make_response(jsonify(res))
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

@app.route("/getHeatmap")
def getHeatmap(dataset_name):
    #dataset_name = request.args.get("dataset_name")
    print(dataset_name)
    data = None
    feature_names = None
    if("_updated" in dataset_name):
        data = np.loadtxt(
            open("../data/" + str(dataset_name) + ".csv", "rb"),
            delimiter=",",
            skiprows=1)
        feature_names = np.genfromtxt("../data/" + dataset_name + ".featurenames.csv",
            delimiter=",",
            dtype='str',
            skip_header=1)
    else:
        data = np.loadtxt(
            open("./sample_data/" + str(dataset_name) + ".csv", "rb"),
            delimiter=",",
            skiprows=1)
        feature_names = np.genfromtxt("./sample_data/" + dataset_name + ".featurenames.csv",
            delimiter=",",
            dtype='str',
            skip_header=1)

    X = None
    if("_updated" in dataset_name):
        X = data[:, 1:-3]
    else:
        X = data[:, :-3]
    y = np.int_(data[:, -3])
    unique_labels = np.unique(y)

    print(X.shape)
    _, n_feats = X.shape
    n_labels = len(unique_labels)
    first_cpc_mat = np.zeros((n_feats, n_labels))
    feat_contrib_mat = np.zeros((n_feats, n_labels))

    # 1. get the scaled feature contributions and first cPC for each label
    ccpca = CCPCA(n_components=1)
    for i, target_label in enumerate(unique_labels):
        ccpca.fit(
            X[y == target_label],
            X[y != target_label],
            var_thres_ratio=0.2,
            n_alphas=80,
            max_log_alpha=0.2)
        first_cpc_mat[:, i] = ccpca.get_first_component()
        feat_contrib_mat[:, i] = ccpca.get_scaled_feat_contribs()

    if(dataset_name=="mnist_updated" or dataset_name=="fashion_mnist_updated"):
        xlabel_names = [None] * n_labels
        for i, label in enumerate(unique_labels):
            if(unique_labels[label] == -1):
                c = "Z"
            else:
                c = chr(65+unique_labels[label])
            xlabel_names[i] = str(c)
        f = open("/home/user/Desktop/heatmap/data/"+dataset_name+"_labels.csv", "w")
        f.write("label\n")
        for label in xlabel_names:
            f.write(str(label)+"\n")
        f.close()
        print(xlabel_names)

        ylabel_names = feature_names.tolist()
        f = open("/home/user/Desktop/heatmap/data/"+dataset_name+"_features.csv", "w")
        f.write("feature\n")
        for feature in ylabel_names:
            f.write(str(feature)+"\n")
        f.close()

        f = open("/home/user/Desktop/heatmap/data/"+dataset_name+"_heatmap.csv", "w")
        f.write("feature,label,contribution\n")
        for i, feature in enumerate(ylabel_names):
            for j, label in enumerate(xlabel_names):
                f.write(str(feature)+","+str(label)+","+str(feat_contrib_mat[i, j])+"\n")

    else:
        # 2. apply optimal sign flipping
        OptSignFlip().opt_sign_flip(first_cpc_mat, feat_contrib_mat)

        # 3. apply hierarchical clustering with optimal-leaf-ordering
        mr = MatReorder()
        feat_contrib_mat = mr.fit_transform(feat_contrib_mat)

        # 4. apply aggregation
        n_feats_shown = n_feats
        agg_feat_contrib_mat, label_to_rows, label_to_rep_row = mr.aggregate_rows(
            feat_contrib_mat, n_feats_shown, agg_method='abs_max')

        # plot cluster names
        xlabel_names = [None] * n_labels
        for i, label in enumerate(mr.order_col_):
            if(unique_labels[label] == -1):
                c = "Z"
            else:
                c = chr(65+unique_labels[label])
            xlabel_names[i] = str(c)
        
        f = open("../data/"+dataset_name+"_labels.csv", "w")
        f.write("label\n")
        for label in xlabel_names:
            f.write(str(label)+"\n")
        f.close()
        
        # plot feature names
        ylabel_names = np.array(feature_names)[mr.order_row_]
        # ylabel_names = np.array(feature_names, dtype=object)[label_to_rep_row]
        # for i in range(len(ylabel_names)):
        #     name = ylabel_names[i]
        #     rows = label_to_rows[i]
        #     if len(rows) > 1:
        #         ylabel_names[i] = name + ', ' + str(len(rows) - 1) + ' more'
        ylabel_names = ylabel_names.tolist()
        
        f = open("../data/"+dataset_name+"_features.csv", "w")
        f.write("feature\n")
        for feature in ylabel_names:
            f.write(str(feature)+"\n")
        f.close()

        f = open("../data/"+dataset_name+"_heatmap.csv", "w")
        f.write("feature,label,contribution\n")
        for i, feature in enumerate(ylabel_names):
            for j, label in enumerate(xlabel_names):
                f.write(str(feature)+","+str(label)+","+str(feat_contrib_mat[i, j])+"\n")
        f.close()
        
@app.route("/getFeatMat")
def featMatGen():
    dataset_name = request.args.get("datasetName")
    label = request.args.get("variable")
    print(label)
    data = None
    if("_updated" in dataset_name):
        data = pd.read_csv("../data/" + dataset_name + ".csv")
        data = data.loc[data['label'] == int(label)]
        data = data.iloc[:, 1:-3]
    else:
        data = pd.read_csv("./sample_data/" + dataset_name + ".csv")
        data = data.loc[data['label'] == int(label)]
        data = data.iloc[:, 0:-3]
    if("mnist" in dataset_name):
        data = data [:, 0:11]
    corr = data.corr()
    data.to_csv("../data/dataset"+str(label)+".csv",index=False)
    resp = make_response()
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

@app.route("/getWordCloud")
def wordCloudGen():
    import pandas as pd
    import numpy as np
    import matplotlib.pyplot as plt
    from ccpca import CCPCA
    from opt_sign_flip import OptSignFlip
    from mat_reorder import MatReorder
    # print("I was here")
    # classLabel = request.get.params("label")
    dataset_name = request.args.get("datasetName")
    print(dataset_name)
    data = None
    feature_names = None
    if("_updated" in dataset_name):
        data = np.loadtxt(
            open("../data/" + str(dataset_name) + ".csv", "rb"),
            delimiter=",",
            skiprows=1)
        feature_names = np.genfromtxt("../data/" + dataset_name + ".featurenames.csv",
            delimiter=",",
            dtype='str',
            skip_header=1)
    else:
        data = np.loadtxt(
            open("./sample_data/" + str(dataset_name) + ".csv", "rb"),
            delimiter=",",
            skiprows=1)
        feature_names = np.genfromtxt("./sample_data/" + dataset_name + ".featurenames.csv",
            delimiter=",",
            dtype='str',
            skip_header=1)
    print(feature_names)
    X = None
    if("_updated" in dataset_name):
        X = data[:, 1:-3]
    else:
        X = data[:, :-3]
    y = np.int_(data[:, -3])
    unique_labels = np.unique(y)

    target_label = 0

    ccpca = CCPCA(n_components=2)
    ccpca.fit(
        X[y == target_label],
        X[y != target_label],
        var_thres_ratio=0.5,
        n_alphas=40,
        max_log_alpha=0.5)

    # get results
    cpca_result = ccpca.transform(X)
    best_alpha = ccpca.get_best_alpha()
    cpca_fcs = ccpca.get_feat_contribs()

    X = data[:, :-3]
    y = np.int_(data[:, -3])
    unique_labels = np.unique(y)

    _, n_feats = X.shape
    n_labels = len(unique_labels)
    first_cpc_mat = np.zeros((n_feats, n_labels))
    feat_contrib_mat = np.zeros((n_feats, n_labels))

    ccpca = CCPCA(n_components=1)
    for i, target_label in enumerate(unique_labels):
        ccpca.fit(
            X[y == target_label],
            X[y != target_label],
            var_thres_ratio=0.5,
            n_alphas=40,
            max_log_alpha=0.5)

        first_cpc_mat[:, i] = ccpca.get_first_component()
        feat_contrib_mat[:, i] = ccpca.get_scaled_feat_contribs()

    OptSignFlip().opt_sign_flip(first_cpc_mat, feat_contrib_mat)

    mr = MatReorder()
    mr.fit_transform(feat_contrib_mat)

    print(feature_names)
    combined = np.vstack((feature_names, cpca_fcs)).T
    print(combined)
    pd.DataFrame(combined).to_csv("../data/featContrib.csv")
    resp = make_response()
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

if __name__ == '__main__':
    app.run(debug=True)
