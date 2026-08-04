import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BaseService } from '../../shared/base-service';
import { inject } from '@angular/core';
import { CreateUser } from '../models/create.user';
import { Observable } from 'rxjs';
import { CreateStudio } from '../models/create.studio';
import { CreateConsumer } from '../models/create.consumer';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
    private readonly baseUrl = `${environment.apiUrl}/auth`;
    protected baseService = inject(BaseService);

    createUser(createUserForm : CreateUser) : Observable<string>{
        const url = `${this.baseUrl}/create/user`;
        return this.baseService.post(url, createUserForm);
    }

    createStudio(createStudioForm: CreateStudio): Observable<string> {
        const url = `${this.baseUrl}/create/studio/${createStudioForm.userId}`;
        return this.baseService.post(url, createStudioForm);
    }

    createConsumer(createConsumerForm: CreateConsumer) : Observable<string>{
        const url = `${this.baseUrl}/create/consumer/${createConsumerForm.userId}`;
        const formData = new FormData();

        formData.append('UserId', createConsumerForm.userId);
        formData.append('FullName', createConsumerForm.fullName);
        formData.append('PhoneNumber', createConsumerForm.phoneNumber);

        if (createConsumerForm.bio !== null) {
            formData.append('Bio', createConsumerForm.bio);
        }

        if (createConsumerForm.formFile !== null) {
            formData.append('formFile', createConsumerForm.formFile, createConsumerForm.formFile.name);
        }

        return this.baseService.post(url, formData);
    }

    uploadConsumerPhoto(consumerId: string, file: File): Observable<string> {
        const url = `${this.baseUrl}/upload/consumer/photo/${consumerId}`;
        const formData = new FormData();
        formData.append('file', file);
        return this.baseService.post(url, formData);
    }
}
