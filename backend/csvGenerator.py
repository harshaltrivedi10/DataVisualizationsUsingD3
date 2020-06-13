import pandas as pd
import os.path
import csv

class dap_manip:
    def data_updater(self,points, fileName):
        id_list = []

        # create file if it does not exist
        if not os.path.exists(fileName+"_updated.csv"):
            df1 = pd.read_csv(fileName+".csv")
            df1.to_csv(fileName+"_updated.csv")

        # append selected points in list
        for point in points:
            id_list.append(point['id'])
            # print(type(point['id']))
        print(id_list)
        # find maximum present label and initialize new_label
        df = pd.read_csv(fileName+"_updated.csv")
        print (df['label'].max())
        new_label = df['label'].max() + 1

        # create list from csv
        with open(fileName+"_updated.csv", 'r') as f:
            reader = csv.reader(f)
            your_list = list(reader)

        # change the values in list
        for i in id_list:
            your_list[i][-3] = new_label

        # write back list to csv
        df = pd.DataFrame(your_list)
        df.to_csv(fileName+"_updated.csv", header= None, index = None)