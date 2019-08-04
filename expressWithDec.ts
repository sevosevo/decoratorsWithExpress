
import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import express = require('express');

interface RouteDefinition {
  path:string;
  requestMethod: 'get' | 'post' | 'delete' | 'put',
  methodName: string;
}
/**
 * @param prefix {string} Root route 
*/
export const Controller = (prefix?:string): ClassDecorator => {
  return (target:any/*Class*/) => {
    if(prefix){ 
      let p : string;
      if(prefix.startsWith('/')) {
        p = prefix;
      }else{
        p = '/'+prefix;
      }
      Reflect.defineMetadata('prefix', p, target);
    }else{
      Reflect.defineMetadata('prefix', '/', target);
    }
    if(!Reflect.getMetadata('routes', target)) 
      Reflect.defineMetadata('routes', [], target);
  }
};
/**
 * @param path {string} Middleware/Route path
 * @description Express decorator
*/
export const Get = (path:string): MethodDecorator => {
  return (target, key:string) => {
    if(!Reflect.hasMetadata('routes', target.constructor)) {
      Reflect.defineMetadata('routes', [], target.constructor);
    };
    const routes = ( Reflect.getMetadata('routes', target.constructor) ) as Array<RouteDefinition>
    routes.push({
      requestMethod: 'get',
      path,
      methodName: key
    });
    Reflect.defineMetadata('routes', routes, target.constructor);
  };
}

@Controller('/user')
class UserController {
  @Get('/hello')
  public index(request:Request, response:Response, next:NextFunction) {
    return response.status(200).send('Success');
  }
}

const app = express();

[UserController].forEach(controller => {
  const instance = new controller();
  const prefix = Reflect.getMetadata('prefix', controller);
  const routes: RouteDefinition[] = Reflect.getMetadata('routes', controller);
  routes.forEach(route => {
    console.log(`
    *-------------*
    Adding route: 
      Method: ${route.requestMethod},
      Path: ${prefix}${route.path},
      MethodName: ${route.methodName}
    *-------------*
    `);
    app[route.requestMethod](prefix + route.path, instance[route.methodName]);
  });
});
app.listen(8000, () => console.log('Listening to port '+8000));
