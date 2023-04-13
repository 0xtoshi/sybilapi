// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import truncateEthAddress from 'truncate-eth-address'
interface XY{
    x:any,
    y:any
}

export default class ArbitrumsController {
    

    async getClaimer(){
        let data = await Database.query().from('claimer')
        .select('*')
        return data;
    }

    async uniq(arr, key) {
        return [...new Map(arr.map(item => [item[key], item])).values()]
    }


    async getGroup({request}){
        const page = request.input('page', 1)
        const limit = 100

        let data = await Database.query().from('root_sybil')
        .select('*')
        .orderBy('originCount', 'desc')
        .limit(10)
        .paginate(page,limit);
        return data;
    }
    async positionTarget(totalItems:any) {
    
        let radius = 500;
        let radians = 0;
        let inc = 10 / 360;
        let item = 0;
        var x, y, angle = 0, step = (2*Math.PI) / totalItems;
        var width = 600/2;
        var height = 600/4;
        var itemW = 10, itemH = 2;
        var deg = 0;
        var array : XY[]= [];
        while(item <= totalItems)
        {        
            x = Math.round(width + radius * Math.cos(angle) - itemW/2);
            y = Math.round(height + radius * Math.sin(angle) - itemH/2);        
            
            array.push({
                x : x,
                y: y
            });
    
            radians += inc;
            angle += step;
            ++item;
            deg += 360/totalItems
        }
        return(array);
      }

    async getTree({ params }){
        let data = await Database.query().from('sybil_address')
        .where('to',params.address)
        .select('from','to','value')

        let root_node = {
            id : "1",
            type : 'output',
            data : {label : truncateEthAddress(params.address)},
            position : {
                x : 300,
                y : 200
            }
        }
        let count = data.length;
        let xy = await this.positionTarget(count);
        let node = data.map((value,key) => {
            return({
                id : (key+2).toString(),
                type : 'input',
                data : { label : truncateEthAddress(value.from)},
                position : xy[key],
            });
        })

        let initialEdge = data.map((value,key) => {
            let amount:number = Math.floor(value.value/1e18);
            return({
                id : `e${key+2}-1`,
                source : (key+2).toString(),
                target : "1",
                type : "bezier",
                label : `${amount} ARB`
            })
        })
        return {
            nodes : [...node, root_node],
            edges : initialEdge
        };
    }

    async Flow({ params }){
        let data = await Database.query().from('sybil_address')
        .where('to',params.address)
        .select('from','to','value')

        let root_node = {
            id : "0",
            user : truncateEthAddress(params.address),
            description : `Sybil Group Address ${params.address}`
        };
        let node = data.map((value,key) => {
            let amount:number = Math.floor(value.value/1e18);
            return({
                id : (key+1).toString(),
                user : truncateEthAddress(value.from),
                description : `${truncateEthAddress(value.from)} to ${truncateEthAddress(value.to)} (${amount} ARB)`
            })
        })

        let link = data.map((value,key) => {
            let amount:number = Math.floor(value.value/1e18);
            return({
                source : (key+1).toString(),
                target : "0",
                value : amount
            })
        })
        return {
            nodes : [...node, root_node],
            links : link
        };
    }

    async checkIsSybil({params})
    {
        let data = await Database.query().from('sybil_address')
        .where('from',params.address)
        .select('*')
        return data;
    }


}
