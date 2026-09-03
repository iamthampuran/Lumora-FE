import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class BaseService {
    protected httpClient = inject(HttpClient);

    get(path: string, params: HttpParams = new HttpParams(), headers = new HttpHeaders()) : Observable<any> {
        return this.httpClient.get(path, { params, headers, withCredentials: true });
    }
    
    post(path: string, body: any, headers = new HttpHeaders()) : Observable<any> {
        return this.httpClient.post(path, body, { headers, withCredentials: true });
    }

    delete(path: string, params: HttpParams = new HttpParams(), headers = new HttpHeaders()) : Observable<any> {
        return this.httpClient.delete(path, { params, headers, withCredentials: true });
    }
    
    patch(path: string, body: any, headers = new HttpHeaders()) : Observable<any> {
        return this.httpClient.patch(path, body, { headers, withCredentials: true });
    }
}
