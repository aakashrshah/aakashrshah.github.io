import argparse

parser = argparse.ArgumentParser(description='Choose a target Host.')
parser.add_argument('-n' nargs='?', help='-n <numbr>')
parser.add_argument('--title', nargs='?', type=str,help='--title <titlename>')
parser.add_argument('--content', nargs='?', type=str ,help='--content <content>')
args = parser.parse_args()

numbr = int(args.n)
filename = str(numbr) + ".html"

fileWrite = open(filename,"w")
fileRead = open("index.html","w+")

lineNum = '<li class=""><a href="#item%d' % numbr-1
targetLine = '<li class=""><a href="#item%d">%s</a></li>' %(numbr,args.title)
for line in fileRead:
	if(lineNum in line):
		fileRead.write('\n' + targetLine)

fileWrite.write(args.content)
fileWrite.close()
fileRead.close()